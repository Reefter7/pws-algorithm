class ChemicalElement{
    constructor(position, type){
        this.position = position;
        this.type = type;
		this.isPartOfRing = false;


		//used for detecting loops
		this.visited = 0;
		this.parent;
    };

    static getAllCs = () => elements.filter(element => element.type == 6);
	static getAllHeads = () => {
		let returnArray = [];
		elements.forEach(element => {
			if(element.type == 6 && element.getConnectedCs().length == 1) returnArray.push(element);
		});
		return returnArray;
	}
	static resetDFS = () => elements.forEach(element => {
		element.visited = 0; 
		element.parent = undefined;
	});

    getConnectedCs = () => {
        return [
			...bonds
				.filter(bond=>bond.el1==this && bond.el2.type==6)
				.map(bond=>bond.el2),
			...bonds
				.filter(bond=>bond.el2==this && bond.el1.type==6)
				.map(bond=>bond.el1)
		]
    };

	getBonds = () => {
		return [
			...bonds
				.filter(bond=>bond.el1==this)
				.map(bond=>[bond.type, bond.el2]), //[type, element]
			...bonds
				.filter(bond=>bond.el2==this)
				.map(bond=>[bond.type, bond.el1])
		]
	}
}

class ChemicalBond{
    constructor(element1, element2, bondtype){
        this.el1 = element1;
        this.el2 = element2;
        this.type = bondtype;
    }

	static bondsBetween = (...elements) => {
		if(elements.length < 2) return false;
		if(elements.some(element => !(element instanceof ChemicalElement))) return false;
		let element_combinations = elements.flatMap(
			(el1, idx) => elements.slice(idx+1).map(el2 => [el1, el2])
		);
		let returnArray = [];
		element_combinations.forEach(combination => {
			returnArray.push(
				...bonds.filter(bond=>
					(bond.el1==combination[0] && bond.el2==combination[1]) ||
					(bond.el2==combination[0] && bond.el1==combination[1])
				)
			)
		});
		return [...new Set(returnArray)];
	}
}
///////////////////////////////////////////////////////////////////
console.log('starting...');

///
let bondData = []; //[elmt1, elmt2, type]
let elementData = []; //[pos, typeid]
///
example5(0);
//////

let elements = [];
let bonds = [];
elementData.forEach(element => {
    elements.push(new ChemicalElement(element[0], element[1]));
});
bondData.forEach(bond => {
    // bonds.push(new Bond(bond[0], bond[1], bond[2]));
    bonds.push(new ChemicalBond(
        elements.find(element=>element.position==bond[0]),
        elements.find(element=>element.position==bond[1]),
        bond[2]
    ));
});

/////////////////////////////////////////////////
let c_elements = ChemicalElement.getAllCs();
let possibleStems;
/////////////////////////////////////////////////
//Some steps are simplified to stay within the scope of the algorithm: only structural formulas found in klas 4.
//////STEP 1: Locate all functional groups //////
functionalGroups = findFuncGroups(c_elements); //search.js

//////STEP 2: Find all possible stems ///////////
//a: rings
let rings = [];
function findRingDFS(parent, current) {
	if(current.visited == 2) return;
	if(current.visited == 1){
		let cycle = [];
		let backtrack = parent;
		cycle.push(backtrack);
		while(backtrack != current){
			backtrack = backtrack.parent;
			cycle.push(backtrack);
		}
		cycle.forEach(element => element.isPartOfRing = true);
		rings.push(cycle);
		return;
	}
	current.parent = parent;
	current.visited = 1;

	for(connC of current.getConnectedCs()){
		if(connC == parent) continue;
		findRingDFS(current, connC);
	}
	current.visited = 2;
}
findRingDFS(undefined, c_elements[0]);

//b: non-rings
let stems = [];
let possibleStemHeads = ChemicalElement.getAllHeads();
function findStemDFS(parent, current){
	current.parent = parent;
	if(parent != undefined && possibleStemHeads.includes(current)){
		let stem = [];
		let backtrack = parent;
		stem.push(current, backtrack);
		while(backtrack != undefined && backtrack.parent != undefined){
			backtrack = backtrack.parent;
			stem.push(backtrack);
		}
		stems.push(stem);
		return;
	}
	for(connC of current.getConnectedCs()){
		if(connC === parent || connC.isPartOfRing) continue;
		findStemDFS(current, connC);
	}
}
for(head of possibleStemHeads){
	ChemicalElement.resetDFS();
	findStemDFS(undefined, head);
}
ChemicalElement.resetDFS();

possibleStems = [...rings, ...stems];

console.log(2,possibleStems);

//////STEP 3: All C=C and C≡C in stem //////////
possibleStems = possibleStems.filter(stem => 
	bonds.filter(bond => 
			bond.type != 0 && bond.el1.type == 6 && bond.el2.type == 6
		).every(bond => 
			stem.includes(bond.el1) && stem.includes(bond.el2)
		)
);

console.log(3,possibleStems);
//////STEP 4: All FGs connected ////////////////
possibleStems = possibleStems.filter(stem =>
	functionalGroups.every(fg =>
		stem.includes(fg[2])
	)
);
console.log(4,possibleStems);
//////STEP 5: Longest stem //////////////////////
let longestStemLength = Math.max(...possibleStems.map(array=>array.length));
possibleStems = possibleStems.filter(stem => stem.length == longestStemLength);

console.log(5,possibleStems);
//////STEP 6: Most Branches /////////////////////
let mostBranches = 0; //branch detection: detect C connected to stem that is not part of stem
possibleStems.forEach(stem => {
	let numberOfBranches = 0;
	for(element of stem){
		for(c of element.getConnectedCs()){
			if(stem.includes(c)) continue;
			numberOfBranches += 1;
		}
	}
	mostBranches = Math.max(mostBranches, numberOfBranches);
});
possibleStems = possibleStems.filter(stem => {
	let numberOfBranches = 0;
	for(element of stem){
		for(c of element.getConnectedCs()){
			if(stem.includes(c)) continue;
			numberOfBranches += 1;
		}
	}
	return numberOfBranches == mostBranches;
});


console.log(6,possibleStems);
//////STEP 7: Most imporant FG is lowest number /
let highestPrioFG;
if(possibleStems.length > 1 && functionalGroups.length > 0){
	for([fgtype, prio] of Object.entries(FGPRIORITY)){
		if(functionalGroups.some(fg => fg[1] == fgtype)){
			highestPrioFG = fgtype;
			break;
		}
	}
	let highestPrioFGCs = functionalGroups.filter(fg => fg[1] == highestPrioFG).map(fg => fg[2]);
	let lowestPositionsHighestPrioFG = [Infinity];
	possibleStems.forEach(stem => {
		let positions = [];
		for(element of highestPrioFGCs){
			positions.push(stem.indexOf(element));
		};
		positions = positions
			.filter(position => position != -1)
			.sort((a,b)=>a-b);

		for(const [index, position] of positions.entries()){
			if(position < lowestPositionsHighestPrioFG[index]){
				lowestPositionsHighestPrioFG = positions;
				break;
			}
		}
	});
	possibleStems = possibleStems.filter(stem => {
		let positions = [];
		for(element of highestPrioFGCs){
			positions.push(stem.indexOf(element));
		};
		positions = positions.filter(position => position != -1).sort((a,b)=>a-b);
		return arraysEqual(positions, lowestPositionsHighestPrioFG);
	});
}

console.log(7,possibleStems);

//STEP 8+9: Bonds and Prefixes of stem.

let possibleStemsObjects = [];
possibleStems.forEach(stem => {
	//double and triple bonds
	let doubleBonds = [];
	for(bond of ChemicalBond.bondsBetween(...stem).filter(bond => bond.type > 0)){
		for(element of stem){
			if(bond.el1 == element || bond.el2 == element) {
				doubleBonds.push([stem.indexOf(element) + 1, bond]);
				break;
			}
		}
	}

	let prefixes = [];
	if(functionalGroups.length != 0) {
		//detect prefixes
		for([type,sortLetter] of Object.entries(FGPREFIXLETTERS)){
			positions = [];
			for(fg of functionalGroups.filter(fg => fg[1] != highestPrioFG)){
				for(element of stem){
					if(fg[2] == element && fg[1] == type){
						positions.push(stem.indexOf(element) + 1);
					}
				}
			}
			if(positions.length != 0) prefixes.push(
				{
					type: type,
					positions: positions,
					sortLetter: sortLetter
				}
			)
		}
	}

	let branches = [];
	if(c_elements.length != stem.length){
		//there are branches
		for([idx,element] of Object.entries(stem)){
			for(c_element of element.getConnectedCs()){
				if(stem.includes(c_element)) continue;
				let position = idx + 1;

				let rings = [];
				ChemicalElement.resetDFS();
			//	findRingDFS(undefined, )
				//find longest
				//find branches, NOT previous, not part of ring!

			}
		}
	}
	
	console.log(doubleBonds);
	possibleStemsObjects.push(
		{
			elements: stem,
			length: stem.length,
			doubleBonds: doubleBonds,
			prefixes: prefixes,
			// branches: [
			// 	{
			// 		position: -1,
			// 		length: -1,
			// 		elements: [],
			// 		branches: [
			// 			{
			// 				position: -1,
			// 				length: -1,
			// 				elements: [],
			// 				branches: []
			// 			}
			// 		]
			// 	}
			// ]
		}
		);
});

//move lowest position number to front (index 0 in array)
possibleStemsObjects = possibleStemsObjects.sort((a,b) => {
	function firstDifference(idx){
		if(a.doubleBonds[idx][0] == b.doubleBonds[idx][0]) return firstDifference(idx+1);
		return a.doubleBonds[idx][0] - b.doubleBonds[idx][0];
	}
	return firstDifference(0);
});
let stem = possibleStemsObjects[0];

//find position(s) of highest priority functional group
let highestPrioFGPositions = [];
for(fg of functionalGroups.filter(fg => fg[1] == highestPrioFG).map(fg => fg[2])){
	highestPrioFGPositions.push(stem.elements.indexOf(fg) + 1);
} 

let rawName = {
	stem: {
		length: stem.length,
		doubleBonds: stem.doubleBonds.map(db => [db[0], db[1].type])
	},
	suffix: {
		type: highestPrioFG,
		positions: highestPrioFGPositions
	},
	prefixes: stem.prefixes
}
console.log(rawName);

//CONSTRUCT THE NAME
function name_1() {
	switch(rawName.stem.length){
		case 1: return 'meth';
		case 2: return 'eth';
		case 3: return 'prop';
		case 4: return 'but';
		case 5: return 'pent';
		case 6: return 'hex';
		case 7: return 'hept';
		case 8: return 'oct';
		case 9: return 'non';
		case 10: return 'dec';
		default: return rawName.stem.length;
	}
}
function name_2() {
	if(rawName.stem.doubleBonds == []) return 'aan';
	let returnStr = '';
	if(rawName.stem.doubleBonds.some(b => b[1] == 1)){
		returnStr += '-';
		rawName.stem.doubleBonds.forEach(b => {if(b[1]==1) returnStr += b[0] + ','});
		returnStr = returnStr.slice(0,-1);
		returnStr += '-';
		switch(rawName.stem.doubleBonds.filter(b => b[1] == 1).length){
			case 1: 
				break;
			case 2: 
				returnStr += 'di';
				break;
			case 3:
				returnStr += 'tri';
				break;
			case 4:
				returnStr += 'tetra';
				break;
			case 5:
				returnStr += 'penta';
				break;
			default:
				break;
		}
		returnStr += (rawName.stem.doubleBonds.some(b => b[1] == 2)) ? 'een' : 'en';
	} 
	if(rawName.stem.doubleBonds.some(b => b[1] == 2)){
		returnStr += '-';
		rawName.stem.doubleBonds.forEach(b => {if(b[1]==2) returnStr += b[0] + ','});
		returnStr = returnStr.slice(0,-1);
		returnStr += '-'
		switch(rawName.stem.doubleBonds.filter(b => b[1] == 1).length){
			case 1: 
				break;
			case 2: 
				returnStr += 'di';
				break;
			case 3:
				returnStr += 'tri';
				break;
			case 4:
				returnStr += 'tetra';
				break;
			case 5:
				returnStr += 'penta';
				break;
			default:
				break;
		}
		returnStr += 'yn';
	}
	return returnStr;
}
function name_3() {
	//suffix
	let suffix = FGSUFFIXES[rawName.suffix.type];
	let returnStr = '-';
	for(pos of rawName.suffix.positions.sort((a,b)=>a-b)){
		returnStr += pos + ',';
	}
	returnStr = returnStr.slice(0,-1);
	returnStr += '-';
	returnStr += NUMERICPREFIXES[rawName.suffix.positions.length]
	returnStr += suffix;
	return returnStr;
}
function name_4() {
	//prefixes
	let returnStr = '';
	let prefixes = rawName.prefixes.sort((a,b) => a.sortLetter.charCodeAt(0) - b.sortLetter.charCodeAt(0));
	for([idx, prefix] of Object.entries(prefixes)){
		for(pos of prefix.positions.sort((a,b)=>a-b)){
			returnStr += pos + ',';
		}
		returnStr = returnStr.slice(0,-1);
		returnStr += '-';
		returnStr += NUMERICPREFIXES[prefix.positions.length];
		returnStr += FGPREFIXES[prefix.type];
		if(idx != prefixes.length - 1) returnStr += '-';
	}
	return returnStr;
}

function completeName() {
	return name_4() + name_1() + name_2() + name_3();
}


console.log(functionalGroups);
console.log(possibleStems);

console.log('%c' + structuralFormula + '\n%c' + completeName(), "color: lightblue; font-size: 2em","color: red; font-weight: bold; font-size: 4em")

console.log('started!');