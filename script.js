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
example2(0);
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

//////STEP 3: All C=C and C???C in stem //////////
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
if(possibleStems.length > 1 && functionalGroups.length > 0){
	let highestPrioFG;
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
		return (arraysEqual(positions, lowestPositionsHighestPrioFG));
	});
}

console.log(7,possibleStems);
//////STEP 8: Most important bond is lowest number
if(possibleStems.length > 1){
	let presentBondTypes = [...new Set(ChemicalBond.bondsBetween(...possibleStems.flatMap(v=>v)).map(v=>v.type))];
	console.log(presentBondTypes);

	let mvb
}

/*
let possibleNamesRaw = [];
	possibleNamesRaw.push(
		{
			stem: {
				length: stem.length,
				doubleBonds: [[],[]]
			},
			suffix: {
				type: 'name',
				positions: []
			},
			prefixes: [
				{
					type: 'name',
					positions: [],
					referenceLetter: 'a'
				}
			]
		}
	);
*/


console.log(functionalGroups);
console.log(possibleStems);
console.log('started!');