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

}
///////////////////////////////////////////////////////////////////
console.log('starting...');

///
let bondData = []; //[elmt1, elmt2, type]
let elementData = []; //[pos, typeid]
///
exampleCondensationProducts(0);
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
//All steps marked with *: step not normal, but used to keep in the scope of the algorithm
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

console.log(possibleStems);

//////STEP 3: All C=C and C≡C in stem* //////////
possibleStems = possibleStems.filter(stem => 
	bonds.filter(bond => 
			bond.type != 0 && bond.el1.type == 6 && bond.el2.type == 6
		).every(bond => 
			stem.includes(bond.el1) && stem.includes(bond.el2)
		)
);
console.log(possibleStems);

//////STEP 4: Most FGs connected ////////////////
let mostFGS = 0;
possibleStems.forEach(stem => {
	let numerOfFGs = functionalGroups.filter(fg =>stem.includes(fg[2])).length;
	mostFGS = Math.max(mostFGS, numerOfFGs);
});
possibleStems = possibleStems.filter(stem =>
	functionalGroups.filter(fg =>
		stem.includes(fg[2]).length == mostFGS)
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




// let highestPrioFG;
// for(const stem of possibleStems){
// 	for([fgtype, prio] of Object.entries(FGPRIORITY)){
// 		if(functionalGroups.some(fg => fg[1] == fgtype) && prio > FGPRIORITY[highestPrioFG]){
// 			highestPrioFG = fgtype;
// 			break;
// 		}
// 	}
// }
// for(const stem of possibleStems){
// 	let fgPositions = functionalGroups
// 		.filter(fg => fg[1] == highestPrioFG)
// 		.map(fg => stem.indexOf(fg[2]));
// 	fgPositions.sort((a,b)=>a-b);
// }


console.log(possibleStems);
console.log('started!');