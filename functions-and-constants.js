const ATOMICNUMBER = {
	H: 1,
	C: 6,
	N: 7,
	O: 8,
	S: 16,
	Cl: 17
}

const FGPRIORITY = {
	carbonzuur: 1, 
	sulfonzuur: 2, 
	zuuranhydride: 3, 
	ester: 4, 
	zuurchloride: 5, 
	amide: 6, 
	nitril: 7,
	aldehyde: 8,
	keton: 9,
	alcohol: 10,
	thiol: 11,
	amine: 12,
	ether: 13
};



function random(...args){
	switch (args.length) {
		case 0:
			return Math.random();
		case 1:
			return Math.floor(Math.random() * args[0]);
		case 2:
		default:
			let min = Math.ceil(args[0]);
			let max = Math.floor(args[1]);
			return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}

function arraysEqual(array1, array2) {
    if (!Array.isArray(array1) && !Array.isArray(array2)) {
        return array1 === array2;
    }

    if (array1.length !== array2.length) {
        return false;
    }

    for (var i = 0, len = array1.length; i < len; i++) {
        if (!arraysEqual(array1[i], array2[i])) {
            return false;
        }
    }

    return true;
}