function findFuncGroups(c_elements){
	let funcGroups = [];

	//carbonzuur
	c_elements.forEach(element => {
		let one = []; let two = [];
		for(const a of element.getBonds()){
			if(a[0] == 1 && a[1].type == ATOMICNUMBER.O) one.push(a[1]);
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.O){
				for(const b of a[1].getBonds()){
					if(b[0] == 0 && b[1].type == ATOMICNUMBER.H){
						two.push([a[1], b[1]]);
						break;
					}
				}
			}
		}

		if(one.length > 0 && two.length > 0) funcGroups.push([
			[one[0], two[0][0], two[0][1]],
			'carbonzuur',
			element
		]);
	});

	//sulfonzuur
	c_elements.forEach(element => {
		let one = [];
		for(const a of element.getBonds()){
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.S){
				let two = []; let three = [];
				for(const b of a[1].getBonds()){
					if(b[0] == 1 && b[1].type == ATOMICNUMBER.O) two.push(b[1]);
					if(b[0] == 0 && b[1].type == ATOMICNUMBER.O){
						for(const c of b[1].getBonds()){
							if(c[0] == 0 && c[1].type == ATOMICNUMBER.H){
								three.push([b[1], c[1]]);
								break;
							}
						}
					}
				}
				if(two.length > 1 && three.length > 0) one.push([a[1], two[0], two[1], 
					three[0][0], three[0][1]]);
			}
		}
		if(one.length > 0) funcGroups.push([
			one[0],
			'sulfonzuur',
			element
		]);
	});

	//zuuranhydride
	//ester

	//zuurchloride
	c_elements.forEach(element => {
		let one = []; let two = [];
		for(const a of element.getBonds()){
			if(a[0] == 1 && a[1] == ATOMICNUMBER.O) one.push(a[1]);
			if(a[0] == 0 && a[1] == ATOMICNUMBER.Cl) two.push(a[1]);
		}
		if(one.length > 0 && two.length > 0) funcGroups.push([
			[one[0], two[0]],
			'zuurchloride',
			element
		]);
	});

	//amide
	c_elements.forEach(element => {
		let one = []; let two = [];
		for(const a of element.getBonds()){
			if(a[0] == 1 && a[1].type == ATOMICNUMBER.O) one.push(a[1]);
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.N){
				for(const b of a[1].getBonds()){
					if(b[0] == 0 && b[1] != element) two.push([a[1], b[1]]);
				}
			}
		}
		if(one.length > 0 && two.length > 1) funcGroups.push([
			[one[0], two[0][0], two[0][1], two[1][1]],
			'amide',
			element
		]);
	});

	//nitril
	c_elements.forEach(element => {
		for(const a of element.getBonds()){
			if(a[0] == 2 && a[1].type == ATOMICNUMBER.N) funcGroups.push([
				[bond[1]],
				'nitril',
				element
			]);
		}
	});

	//aldehyde
	c_elements.forEach(element => {
		let one = []; let two = [];
		let hasCl = false; let hasN = false; let hasOH = false;

		for(const a of element.getBonds()){
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.Cl) hasCl = true;
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.N) hasN = true;
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.O){
				for(const b of a[1].getBonds()){
					if(b[0] == 0 && b[1].type == ATOMICNUMBER.H){
						hasOH = true;
						break;
					}
				}
			}

			if(a[0] == 1 && a[1].type == ATOMICNUMBER.O) one.push(a[1]);
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.H) two.push(a[1]);
		}
		if(one.length > 0 && two.length > 0 && !hasCL && !hasN && !hasOH) funcGroups.push([
			[one[0], two[0]],
			'aldehyde',
			element
		]);
	});

	//keton
	c_elements.forEach(element => {
		let one = []; let two = [];
		let hasOH = false; hasCl = false; hasH = false; hasAmine = false;

		for(const a of element.getBonds()){
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.Cl) hasCl = true;
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.H) hasH = true;
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.N) {
				let three = [];
				for(b of a[1].getBonds()){
					if(b[0] == 0 && a[1] != element) three.push(b[1]);
				}
				if(three.length > 1) hasAmine = true;
			}
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.O){
				for(const b of a[1].getBonds()){
					if(b[0] == 0 && b[1].type == ATOMICNUMBER.H){
						hasOH = true;
						break;
					}
				}
			}

			if(a[0] == 1 && a[1].type == ATOMICNUMBER.O) one.push(a[1]);
			if(a[0] == 0 && !hasCl && !hasH && !hasOH && !hasAmine) two.push(a[1]);
		}
		if(one.length > 0 && two.length > 1) funcGroups.push([
			[one[0]],
			'keton',
			element
		]);
	});
	//alcohol
	c_elements.forEach(element => {
		let one = [];
		let hasO = false;
		for(const a of element.getBonds()){
			if(a[0] == 1 && a[1].type == ATOMICNUMBER.O) hasO = true;
			
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.O){
				for(const b of a[1].getBonds()){
					if(b[0] == 0 && b[1].type == ATOMICNUMBER.H){
						one.push([a[1], b[1]]);
						break;
					}
				}
			}
		}
		while(one.length > 0 && !hasO){
			funcGroups.push([
				[one[0][0], one[0][1]],
				'alcohol',
				element
			]);
			one.splice(0,1);
		}
	});
	//thiol
	c_elements.forEach(element => {
		let one = [];
		for(const a of element.getBonds()){
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.S){
				for(const b of a[1].getBonds()){
					if(b[0] == 0 && b[1].type == ATOMICNUMBER.H){
						one.push([a[1], b[1]]);
						break;
					}
				}
			}
		}
		while(one.length > 0){
			funcGroups.push([
				[one[0][0], one[0][1]],
				'thiol',
				element
			]);
			one.splice(0,1);
		}
	});
	
	//amine
	c_elements.forEach(element => {
		let one = [];
		let hasO = false;
		let NpartOfAmide = false;

		for(const a of element.getBonds()){
			if(a[0] == 1 && a[1].type == ATOMICNUMBER.O) hasO = true;
			if(a[0] == 0 && a[1].type == ATOMICNUMBER.N){
				for(const b of a[1].getBonds()){
					if(b[0] == 0 && b[1] != element) one.push([a[1], b[1]]);
					if(b[0] == 0 && b[1].type == ATOMICNUMBER.C){
						for(const c of b[1].getBonds()){
							if(c[0] == 1 && c[1].type == ATOMICNUMBER.O){
								NpartOfAmide = true;
								break;
							}
						}
					}
				}
			}
		}
		while(one.length > 1 && !hasO && !NpartOfAmide){
			funcGroups.push([
				[one[0][0], one[0][1], one[1][1]],
				'amine',
				element
			]);
			one.splice(0,2);
		}
	});

	//ether,halogeenverbinding,nitroverbinding??

	//fenyl (MARK AS VISITED! (RING FINDING))
	let fenyls = []
	c_elements.forEach(element => {
		for(const a of element.getBonds()){
			if(a[0] != 0 || a[1].type != ATOMICNUMBER.C) continue;
			for(const b of a[1].getBonds()){
				if(b[1] == element) continue;
				if(b[0] != 1 || b[1].type != ATOMICNUMBER.C) continue;

				for(const c of b[1].getBonds()){
					if(c[1] == a[1]) continue;
					if(c[0] != 1 || c[1].type != ATOMICNUMBER.C) continue;
					 
					for(const d of c[1].getBonds()){
						if(d[1] == b[1]) continue;
						if(d[0] != 1 || d[1].type != ATOMICNUMBER.C) continue;
						 
						for(const e of d[1].getBonds()){
							if(e[1] == c[1]) continue;
							if(e[0] != 1 || e[1].type != ATOMICNUMBER.C) continue;
							 
							for(const f of e[1].getBonds()){
								if(f[1] == d[1]) continue;
								if(f[0] != 1 || f[1].type != ATOMICNUMBER.C) continue;
								 
								for(const g of f[1].getBonds()){ 	
									if(g[1] != a[1]) continue;
									fenyls.push([
										[a[1], b[1], c[1], d[1], e[1], f[1]],
										'fenyl',
										element
									]);
								}
							}
						}
					}
				}
			}
		}
	});
	//if(funcGroups.length == 0 && fenyls > 0) fenyls.shift();
	funcGroups = funcGroups.concat(fenyls);
	return funcGroups
}