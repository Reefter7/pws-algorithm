function runAlgorithm(elementData, bondData, debugMolecularFormula) {	
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

//////STEP 3: All C=C and C≡C in stem //////////
possibleStems = possibleStems.filter(stem => 
	bonds.filter(bond => 
			bond.type != 0 && bond.el1.type == 6 && bond.el2.type == 6
		).every(bond => 
			stem.includes(bond.el1) && stem.includes(bond.el2)
		)
);
//////STEP 4: All FGs connected ////////////////
possibleStems = possibleStems.filter(stem =>
	functionalGroups.every(fg =>
		stem.includes(fg[2])
	)
);
//////STEP 5: Longest stem //////////////////////
let longestStemLength = Math.max(...possibleStems.map(array=>array.length));
possibleStems = possibleStems.filter(stem => stem.length == longestStemLength);
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
//////
let possibleStemsObjects =[];
possibleStems.forEach(stem => {
	//double/triple bonds
	let doubleBonds = [];
	for(bond of ChemicalBond.bondsBetween(...stem).filter(bond => bond.type > 0)) {
		for(element of stem){
			if(bond.el1 == element || bond.el2 == element){
				doubleBonds.push([stem.indexOf(element) +1, bond]);
				break;
			}
		}
	}
	//secondary functional groups
	let secondaryFGs = [];
	if(functionalGroups.length > 0) {
		for([type,sortLetter] of Object.entries(FGPREFIXLETTERS)){
			let positions = [];
			let elements = [];
			for(fg of functionalGroups.filter(fg => fg[1] != highestPrioFG)){
				for(element of stem){
					if(fg[2] == element && fg[1] == type){
						positions.push(stem.indexOf(element) + 1);
						elements.push(element, ...fg[0]);
					}
				}
			}
			if(positions.length > 0){
				secondaryFGs.push({
					type: type,
					positions: positions,
					sortLetter: sortLetter,
					elements: elements
				});
			}
		}
	}

	//branches
	let branches = [];
	if(c_elements.length > stem.length) {
		for([idx, element] of Object.entries(stem)){
			for(c_element of element.getConnectedCs()){
				if(stem.includes(c_element)) continue;
				let position = Number.parseInt(idx) + 1;
				let branchElements = [];
				function findBranchDFS(parent, current){
					current.parent = parent;
					const connectedCs = current.getConnectedCs();
					if(connectedCs.length == 1) {
						let backtrack = parent;
						branchElements.push(current, backtrack);
						while(backtrack != undefined && backtrack.parent != undefined) {
							backtrack = backtrack.parent;
							branchElements.push(current);
						}
						branchElements.pop();					}
					for(connC of connectedCs){
						if(connC === parent || connC.isPartOfRing) continue;
						findBranchDFS(current, connC);
					}
				}
				findBranchDFS(element, c_element);
					branches.push({
					positions: [position],
					length: branchElements.length,
					elements: branchElements
				});
			}
		}
	}

	//complete
	possibleStemsObjects.push({
		stem: stem,
		length: stem.length,
		doubleBonds: doubleBonds,
		secondaryFGs: secondaryFGs,
		branches: branches
	});
})

//move lowest position number to the front (= index 0 of the array)
possibleStemsObjects = possibleStemsObjects.sort((a,b) => {
	function firstDifference(index){
		if(a.doubleBonds[index][0] == b.doubleBonds[index][0]) return firstDifference(index+1);
		return a.doubleBonds[index][0] - b.doubleBonds[index][0];
	}
	firstDifference(0);
});
let stem = possibleStemsObjects[0];

//find position(s) of highest prio functional group
let highestPrioFGPositions = [];
for(fg of functionalGroups.filter(fg => fg[1] == highestPrioFG).map(fg => fg[2])){
	highestPrioFGPositions.push(stem.stem.indexOf(fg) + 1);
}

let nameElements = [];
//prefixes (branches + functional groups)
stem.branches.forEach(branch => {
	branch.name = STEMNAMES[branch.length] + 'yl';
	branch.sortLetter = branch.name;
});
let prefixes = stem.branches.concat(stem.secondaryFGs);
prefixes = prefixes.sort((a,b)=>a.sortLetter.charCodeAt(0) - b.sortLetter.charCodeAt(0));
let positionsConstructor = [];
for([idx, prefix] of Object.entries(prefixes)){
	let elementConstructor = '';
	for(pos of prefix.positions.sort((a,b)=>a-b)){
		elementConstructor += pos + ',';
	}
	elementConstructor = elementConstructor.slice(0, -1);
	elementConstructor += '-' + NUMERICPREFIXES[prefix.positions.length];
	const isFGnotBranch = (prefix.hasOwnProperty('type'));
	(isFGnotBranch)
		? elementConstructor += FGPREFIXES[prefix.type]		
		: elementConstructor += prefix.name;
	nameElements.push([elementConstructor, prefix.elements]);
	if(idx != prefixes.length - 1) nameElements.push(['-', []])
}

//stem
nameElements.push([STEMNAMES[stem.length], stem.stem]);

//double/triple bonds
if(stem.doubleBonds.length == []){
	nameElements.push(['aan', stem]);
} else {
	dbonds = stem.doubleBonds.filter(bond => bond[1].type == 1);
	tbonds = stem.doubleBonds.filter(bond => bond[1].type == 2);
	//C=C bond
	let elementConstructor = '';
	if(dbonds.length > 0) elementConstructor += '-';
	dbonds.forEach(bond => elementConstructor += bond[0] + ',');
	elementConstructor = elementConstructor.slice(0, -1);
	elementConstructor += '-' + NUMERICPREFIXES[dbonds.length];
	elementConstructor += (tbonds.length > 0) ? 'en' : 'een';
	let positionsConstructor = [];
	dbonds.forEach(bond => positionsConstructor.push(bond[1].el1, bond[1].el2));
	nameElements.push([elementConstructor, positionsConstructor]);
	//C≡C bond
	elementConstructor = '';
	if(tbonds.length > 0) elementConstructor += '-';
	tbonds.forEach(bond => elementConstructor += bond[0] + ',');
	elementConstructor = elementConstructor.slice(0, -1);
	elementConstructor += '-' + NUMERICPREFIXES[tbonds.length] + 'yn';
	positionsConstructor = [];
	tbonds.forEach(bond => positionsConstructor.push(bond[1].el1, bond[1].el2));
	nameElements.push([elementConstructor, positionsConstructor]);
}

//suffix
let suffix = FGSUFFIXES[highestPrioFG];
let elementConstructor = '';
if(highestPrioFGPositions.length > 0) elementConstructor += '-';
for(pos of highestPrioFGPositions.sort((a,b)=>a-b)) elementConstructor += pos + ',';

elementConstructor = elementConstructor.slice(0, -1) + '-' + NUMERICPREFIXES[highestPrioFGPositions.length] + suffix;
positionsConstructor = functionalGroups.filter(fg => fg[1] == highestPrioFG).flatMap(fg => fg[0]);
nameElements.push([elementConstructor, positionsConstructor]);
nameElements.forEach(a => a[1] = a[1].map(b => b.position));

function completeName(){
	let returnStr = '';
	nameElements.forEach(nameElement => returnStr += nameElement[0]);
	return returnStr;
}

let output = document.getElementById('output');
for([a,b] of nameElements){
	output.innerHTML += `<span class="output2" onclick="document.getElementById('output2').innerHTML = '${b}'">${a}</span>`;
}

 console.log('%c' + debugMolecularFormula + '\n%c' + completeName(), "color: lightblue; font-size: 2em","color: red; font-weight: bold; font-size: 4em")

console.log('started!');}