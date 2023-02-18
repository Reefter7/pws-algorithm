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
};

const FGSUFFIXES = {
	carbonzuur: 'zuur',
	sulfonzuur: 'sulfonzuur',
	zuuranhydride: 'zuuranhydride',
	amide: 'amide',
	nitril: 'nitril',
	aldehyde: 'al',
	keton: 'on',
	alcohol: 'ol',
	thiol: 'thiol',
	amine: 'amine',
}

const FGPREFIXLETTERS = {
	nitril: 'c',
	aldehyde: 'o',
	keton: 'o',
	alcohol: 'h',
	thiol: 's',
	amine: 'a'
}

const FGPREFIXES = {
	nitril: 'cyaan',
	aldehyde: 'oxo',
	keton: 'oxo',
	alcohol: 'hydroxy',
	thiol: 'sulfanyl',
	amine: 'amino',
}

const NUMERICPREFIXES = {
	0: '',
	1: '',
	2: 'di',
	3: 'tri',
	4: 'tetra',
	5: 'penta',
	6: 'hexa',
	7: 'hepta'
}

const STEMNAMES = {
	1: 'meth',
	2: 'eth',
    3: 'prop',
    4: 'but',
	5: 'pent',
    6: 'hex',
	7: 'hept',
	8: 'oct',
    9: 'non',
    10: 'dec',
    11: 'undec',
    12: 'duodec'
}

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
