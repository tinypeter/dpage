var dpage=(/*module.exports=*/function(options){
	
function Dpage(options){
	this.schema=[];	//[cid]=[{id:id,schema:s,delegations:[{e:event,f:callback_func}]}]
	this.states=[]; //[cid]={ts:last usage timestamp} 
	this.pages=[];	//[cid]=[{id:id,p:page,r:before-remove}]
	var opts=options || {max:2};
	this.max=opts.max ;
};

var log=function(msg){
	console.log(new Date()+':'+msg);
};

Dpage.prototype=Dpage;

/* function that register schemas .  
 * @cid: cluster id of the schema
 * @id: the id of the schema
 * @s: schema.
 * @c: callback=after-created
 * @r: callback=before-removed
 * @fn:callback after created
 * return: none.
 * */

Dpage.prototype.addSchema=function(cid,id,s,c,r,delegations){
	var sf=this;
	if(!sf.schema[cid]){
		sf.schema[cid]=new Array();
	}
	sf.schema[cid].push({
		id:id
		,s:s
		,c:c
		,r:r
		,f:delegations
	});
};

/* function that retrieve or create a new page .  
 * @preserves: cid list of DOM object to preserve. [{cid:cid}]  
 * @tocreates: cid list of DOM object which will be retrieved or created.[{cid:cid}]
 * @fn: the callback function(err).
 * return: none.
 * */

Dpage.prototype.page=function(tocreates,preserves,fn){
	var sf=this;
	try{
		//p1: pages - preserves = candidates  
		//p2: p1 & tocreates = no creations 
		//p3: p1- p2 = can release  
		//p4: tocreates - p2 = to create 
		var p1=[],p2=[],p3=[],p4=[],pagelen=0;
		for(var cid in sf.pages){
			pagelen++;
			var isin=false;
			for(var j=0;j<preserves.length;j++){
				if(cid == preserves[j].cid ){
					isin=true;
					break;	
				}
			}
			if(isin==false){
				p1.push(cid);
				for(var j=0;j<tocreates.length;j++){
					if(cid == tocreates[j].cid ){
						p2.push(cid);
						isin=true;
						break;
					}
				}
				if(isin==false){
					p3.push(cid);
				}
			}
		}
		for(var i=0;i<tocreates.length;i++){
			var isin=false;
			for(var j=0;j<p2.length;j++){
				if(tocreates[i].cid == p2[j] ){
					isin=true;
					break;
				}
			}
			if(isin==false){
				p4.push(tocreates[i].cid);
			}
		}
		//release num
		var rl=(pagelen + p4.length)-sf.max;
		//sort p3
		for(var i=0;i<p3.length-1;i++){
			for(var j=i+1;j<p3.length;j++){
				if(sf.states[p3[i]].ts > sf.states[p3[j]].ts ){
					var tcid=p3[i];
					p3[i]=p3[j];
					p3[j]=tcid;
				}
			}
		}
		//release
		for(var i=0; (i<rl) && (p3.length > 0) ;i++){
			var cid=p3[i];
			var p=sf.pages[cid];
			for(var j=0;j<p.length;j++){
				if('function'===typeof p[j].r){
					p[j].r(p[j].id);
				}
				p[j].p.remove();
			}
			delete sf.pages[cid];
			delete sf.states[cid];
			p3.splice(i);
			i--;
		}
		//create
		for(var i=0;i<p4.length;i++){
			var cid=p4[i];
			if(sf.pages[cid]){	//DOM object exists already
				continue;
			}
			var o=sf.schema[cid]; //[{id:id,schema:s,c:after-create,r:before-remove,delegations:[{e:event,f:callback_func}]}]
			for(var j=0;j<o.length;j++){
				var np=$(o[j].s);
				np.appendTo( $.mobile.pageContainer);
				//for debug
				//var np=o[j].s;
				//for debug end
				if(!sf.pages[cid]){
					sf.pages[cid]=[];
				}
				sf.pages[cid].push({
					id:o[j].id
					,p:np
					,r:o[j].r
				});
				var d=o[j].f;//delegations
				for(var k=0;k<d.length;k++){
					//for debug
					//console.log('id:'+o[j].id);
					//console.log('event:'+d[k].e);
					//console.log('function:'+d[k].f);
					//for debug end
					$(document).delegate('#'+o[j].id,d[k].e,d[k].f);
				}
				//after creation
				if('function'===typeof o[j].c){
					o[j].c(o[j].id);
				}
			}
		}
		//timestamp
		for(var i=0;i<tocreates.length;i++){
			var cid=tocreates[i].cid;
			sf.states[cid]={ts:new Date()};
		}
		//return
		if(fn && 'function'===typeof fn){
			fn(null);
		}
	}catch(err){
		if(fn && 'function'===typeof fn){
			fn(err);
		}
	}
};


///* Function that print the schema
// * 
// * */
//Dpage.prototype.printSchema=function(){
//	var sf=this;
//	for(var cid in sf.schema){
//		var ska=sf.schema[cid];
//		log('schema['+cid+']:');
//		for(var j=0;j<ska.length;j++){
//			var s=ska[j];
//			log('id:'+s.id);
//			log('s:'+s.s);
//			for(var i=0;i<s.f.length;i++){
//				log('f['+i+'].e:'+s.f[i].e);
//				log('f['+i+'].f:'+s.f[i].f);			
//			}
//		}
//	}
//};

///* Test case Function
// * 
// * */
//Dpage.prototype.testf=function(){
////schema
////'home':{id:'home',s:'s_home',d:[
////{e:'button1',button1_func},
////{e:'click1',click1_func}	
////	]}	
////'home':{id:'award',s:'s_award',d:[
////{e:'button2',button2_func},
////{e:'click2',click2_func}	
////	]}	
////'user':{id:'me',s:'s_me',d:[
////{e:'button3',button3_func},
////{e:'click3',click3_func}	
////]}
////Test case 1	
//	var sf=this;
//	sf.addSchema('home','home','s_home',[{
//		e:'button1',f:function(){console.log('button1_function');}
//	},{
//		e:'click1',f:function(){console.log('click1_function');}
//	}]);
//	//log('after schema 1: ');
//	//sf.printSchema();====> Passed.
//	sf.addSchema('home','award','s_award',[{
//		e:'button2',f:function(){console.log('button2_function');}
//	},{
//		e:'click2',f:function(){console.log('click2_function');}
//	}]);
//	//log('after schema 2: ');
//	//sf.printSchema();====>Passed.
//	sf.addSchema('user','me','s_me',[{
//		e:'button3',f:function(){console.log('button3_function');}
//	},{
//		e:'click3',f:function(){console.log('click3_function');}
//	}]);
//	//log('after schema 3: ');
//	//sf.printSchema();====>Passed.
//	sf.addSchema('misc','info','s_info',[{
//		e:'button4',f:function(){console.log('button4_function');}
//	},{
//		e:'click4',f:function(){console.log('click4_function');}
//	}]);
////Test case 2: page(['user'],[],f);====>Passed. 
////	sf.page([{cid:'user'}],[],function(err){
////		log(err);
////	});
////Test case 3: page(['home'],null,f); ====>Passed.
////	sf.page([{cid:'home'}],[],function(err){
////		log(err);
////	});
////Test case 4: page(['user','home'],null,f); ====>Passed.
////	sf.page([{cid:'user'},{cid:'home'}],[],function(err){
////		log(err);
////	});
////Test case 5: page(['home','user'],null,f);====>Passed. 
////	sf.page([{cid:'home'},{cid:'user'}],[],function(err){
////		log(err);
////	});
////Test case 6: page(['user'],null,f)--page(['home'],null,f)====>Passed.
////	sf.page([{cid:'user'}],[],function(err){
////		log(err);
////	});
////	sf.page([{cid:'home'}],[],function(err){
////		log(err);
////	});
////Test case 7: page(['user'],null,f)--page(['user'],null,f)====>Passed. 
////	sf.page([{cid:'user'}],[],function(err){
////		log(err);
////	});
////	sf.page([{cid:'user'}],[],function(err){
////		log(err);
////	});
////Test case 8: page(['user'],null,f)--page(['home'],['user'],f)====>Passed.
////	sf.page([{cid:'user'}],[],function(err){
////		log(err);
////	});
////	sf.page([{cid:'home'}],[{cid:'user'}],function(err){
////		log(err);
////	});
////Test case 9: page(['user'],null,f)--page(['user'],['home'],f)====>Passed 
////	sf.page([{cid:'user'}],[],function(err){
////		log(err);
////	});
////	sf.page([{cid:'user'}],[{cid:'home'}],function(err){
////		log(err);
////	});
////Test case 9: page(['user'],[],f)--page(['home'],[],f)--page(['misc'],['user'],f) ====>Passed.
////	sf.page([{cid:'user'}],[],function(err){
////		log(err);
////	});
////	sf.page([{cid:'home'}],[],function(err){
////		log(err);
////	});
////	sf.page([{cid:'misc'},{cid:'user'}],[{cid:'user'}],function(err){
////		log(err);
////	});
//};

//if (typeof module !== 'undefined') {
//	return new Dpage(options);
//}else{
	return {start: function(options){
			return new Dpage(options);	
		}
	};
//}
})();

