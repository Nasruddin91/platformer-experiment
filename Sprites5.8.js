/********************************************************
5.8.2  better encapsulation, simplified layering
       no more dom elements in back, no more fgnd img
5.8.3  fgnd pic again
5.8.4  new bkgnd and fgnd list object
5.8.5  canvas text
5.8.6  uniform box model with rotation (cannot be done)
5.8.7  no dom elements, no syle 
5.8.8  consistent line obj, rounded corner Rect

Problem: border extends shape, isInside must adjust
********************************************************/
//alert('Sprites5.8.8')



//*******************global variables********************
var Frame = (function(){
	
	var canvasElemList = createObjList();

	
	//the frame object
	var frm = {
		//properties
		left: 0,
		top: 0,
		w: 500,
		h: 300,
		col: '#ccc',
		
		bdy: null, 		//dom body element
		canvas: null,	//dom canvas element
		ctx: null,		//2d context
		
		bkgndImg: null,
		fgndImg: null,
		
		//methods
		init: init,		//initialize the frame
		draw: draw,		//clear canvas and draw all objects
		addBkgndImg: addBkgndImg,
		addFgndImg: addFgndImg,
		purge: purge,	//remove all objects from canvas
		
		//layer management
		toBack: canvasElemList.toBack,
		toFront: canvasElemList.toFront,
		up: canvasElemList.up,
		down: canvasElemList.down,
		
		
		
		//internal only use
		draggedObj: null,	
		proto: new ProtoSprite(),
		
		discard: discard,
		register: register,
		showCanvas: showCanvas,//debugging aid
		handleClick: handleClick,
		handleMouseMove: handleMouseMove,
	}
	
	
	//frm.toBack = canvasElemList.toBack;
	//frm.toFront = canvasElemList.toFront;
	//frm.up = canvasElemList.up;
	//frm.down = canvasElemList.down;
	
	
	var canvas;
	var ctx;
	
	var fgObj = {
		id: 'fgnd',
		visible: true,
		isInside: function(){return false;},
		draw: function(){
			ctx.drawImage(frm.fgndImg, frm.left, frm.top, frm.w, frm.h);
		}, //draw
	}
	
	var bgObj = {
		id: 'bkgnd',
		visible: true,
		isInside: function(){return false;},
		draw: function(){
			if (frm.bkgndImg){
				ctx.drawImage(frm.bkgndImg, frm.left, frm.top, frm.w, frm.h);
			} else if (frm.col!='none'){
				ctx.save();
				ctx.fillStyle = frm.col;
				ctx.fillRect(frm.left, frm.top, frm.w, frm.h);
				ctx.restore();
			}
		},//draw
	}
	
	//add bgElement
	canvasElemList.push(bgObj);
	
	
	function createObjList(){
		//me[0]: bgObj, optional fgObj. Objects can be moved up/down
		
		var me = [];
		var top = 1; //index of fgnd obj
		var bot = 1; //lowest obj index before bkgnd
		
		me.addFgnd = function(obj){
			me.top = me.length;   
			me.push(obj);
		}//addFgnd
		
		me.put = function(obj){
			me.splice(top++, 0, obj);
		}//put
		
		me.remove = function(obj){
			var k = me.indexOf(obj);
			me.splice(k, 1);
			if (k<top) top--;
		}//remove
		
		me.up = function(obj){ //alert('canvasElemList up')
			var k = me.indexOf(obj);
			if (k==me.length-1) return;
			me[k] = me[k+1];
			me[k+1] = obj;
			if (k==top-1) top--;
		}//up
		
		me.down = function(obj){
			var k = me.indexOf(obj);
			if (k==bot) return;
			me[k] = me[k-1];
			me[k-1] = obj;
			if (k==top+1) top--;
		}//up
		
		me.toBack = function(obj){
			var k = me.indexOf(obj);
			if (k==bot) return;
			me.splice(k, 1);
			me.splice(bot, 0, obj);
			if (k>top) top++;
		}//toBack
		
		me.toFront = function(obj){ //alert('ObjList.toFront')
			var k = me.indexOf(obj);
			if (k==me.length-1) return;
			me.splice(k, 1);
			me.splice(me.length, 0, obj);
			if (k<top) top--;
		}//toFront
		
		return me;
	}//createObjList

		
	
	function clickCanvas(x, y){ //alert('clickCanvas')  
		for (var i=canvasElemList.length-1; i>=0; i-=1){ 
			var obj = canvasElemList[i];
			if (obj.isInside(x, y) && obj.visible) { 
				if (obj.handleClick) {
					obj.handleClick(x, y); 
					//return true; //upper layers do not mask
				}
				return true; //upper layer mask lower ones
			}
		}
		return false;
	}//clickCanvas
	
	
	function handleClick(e){ //alert('frm.handleClick')
		if (frm.draggedObj){
			frm.draggedObj.stopDraging();
			frm.draggedObj = null;
		} else {
			var x = e.pageX - frm.X0;
			var y = frm.Y0 - e.pageY;
			clickCanvas(x, y);
		}
	}//handleClick




	function init(left, top, w, h, col){
	//initialize frame
	//left: left margin
	//top:  top margin
	//w, h: widht, height
	//col [optional]: fill color
	
		if (col) frm.col = col;
		else frm.col = '#ccc';
		
		frm.left = left;
		frm.top = top;
		frm.X0 = left; 	//frame origin in window coordinates
		frm.Y0 = top + h;	//frame origin in window coordinates
		frm.w = w;
		frm.h = h;
		
		frm.bdy = document.getElementsByTagName('body')[0];
		if (!frm.bdy) {alert('Frame.init called before body created'); return;}
		
		frm.bdy.style.marginTop = 0;
		frm.bdy.style.marginLeft = 0;
		
			
		canvas = document.createElement('canvas');
		frm.canvas = canvas;
		
		canvas.visible = true;
		canvas.typ = 'canvas';
		
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		
		canvas.style.position = 'absolute';
		canvas.style.top = 0;
		canvas.style.left = 0;
		canvas.style.zIndex = 0;
		
		frm.bdy.appendChild(canvas);
	
		ctx = canvas.getContext('2d');  
		frm.ctx = ctx;
		
		//draw();//<----------------------------- ?????
	}//init
	
	
	function draw(){ //alert('drawCanvas')
	//clear canvas and draw all objects
	
		ctx.clearRect(0, 0,  canvas.width, canvas.height);
		ctx.save();
		
		for (var i=0; i<canvasElemList.length; i++) { //alert('frm.draw i='+i)
			if (canvasElemList[i].visible) canvasElemList[i].draw();
		}
		
		ctx.restore();
	}//draw
	

	function addBkgndImg(url){
		frm.bkgndImg = new Image();
		frm.bkgndImg.src = url;
		if (!frm.bkgndImg.complete) frm.bkgndImg.onload = function(){Frame.draw();}
	}//addBkgndImg
	
	
	function addFgndImg(url){ //alert('addFgndImg url='+url)
		frm.fgndImg = new Image();
		frm.fgndImg.src = url;
		if (!frm.fgndImg.complete) frm.fgndImg.onload = function(){Frame.draw();}
		
		canvasElemList.addFgnd(fgObj);
	}//addFgndImg
	
		
	function purge(){ 
		canvasElemList = [canvasElemList[0]]; //keep bgObject
		if (ctx) ctx.clearRect(0, 0,  canvas.width, canvas.height);
	}//purge
	
	
	//auxiliary function for debugging
	function showCanvas(){ //alert('showCanvas')
		var txt = '';
		for (var i=0; i<canvasElemList.length; i++){
			txt+=canvasElemList[i].id+'  ';
		}
		alert(txt);
	}//showCanvas
	

	function discard(obj){ //alert('discard id='+obj.id)
		canvasElemList.remove(obj);
		//<-------------------------------  frm.draw()??????
	}//discard
	
	
	function register(obj){
		canvasElemList.put(obj);
	}//register
	
	
	function handleMouseMove(e){//alert('move') //<------ internalize in init
		var obj = frm.draggedObj;
		var xMouse = e.pageX - frm.X0;
		var yMouse = frm.Y0 - e.pageY;
		var dx = obj.mouseOffsetX + xMouse - obj.x;
		var dy = obj.mouseOffsetY + yMouse - obj.y;
		obj.displace(dx, dy);
		if (obj.handleDrag) obj.handleDrag(xMouse, yMouse);
		draw();
	}//handleMouseMove
	
	
	return frm;
})(); //create the unique frame object


window.onresize = function(){ //alert('onresize')
	Frame.canvas.width = window.innerWidth;
	Frame.canvas.height = window.innerHeight;
	Frame.draw();
}//onresize





//*******************************************************
function initObj(me, x, y, w, h){ 
	//add common properties to a sprite objects
	me.x = x;
	me.y = y;
	me.w = w;
	me.h = h;
	me.r = 0;
	
	me.vx = 0;
	me.vy = 0;
	me.alpha = 0;		//turn angle rad cw
	me.centered = false;  //x,y is center of box
	
	me.col = 'black';	//fill color
	me.borderWidth = 0;	//0 means no border
	me.borderColor = 'black';
	
	//internal properties, not to be touched by user
	me.visible = true;
	me.bearing;			//bearing of vx, vy (rad from N)
	me.handleClick = null;	//click handler
	me.handleDrag = null;	//drag handler
	me.mouseOffsetX = 0; 	//x-mouse offset from obj handle, for dragging
	me.mouseOffsetY = 0;	//y-mouse offset from obj handle, for dragging
}//initObj



function ProtoSprite(){ 
	//prototype of all Sprite objects, common methods 
	
	this.draw = function(){} //draw method (abstract)
	
	this.hide = function(){ this.visible = false;}
	this.show = function(){ this.visible = true; }
		
	this.isInside = function(x, y){} //abstract
	
	this.setBorder = function(width, col){ 
		//set border attributes
		if (!col) {col = 'black';}
		this.borderWidth = width;
		this.borderColor = col;
		//alert('setBorder this.borderWidth='+this.borderWidth+' this.borderColor='+this.borderColor)
		
	}//setBorder
	
	
	this.move = function(dt){
		//a time step in the simulation, displacement by v*dt
		this.displace(this.vx*dt, this.vy*dt);
	}//move
		
	
	this.displace = function(dx, dy){
		//shift object on the plane by dx,dy
		this.x += dx; 
		this.y += dy;
	}//displace

	
	this.moveTo = function(x, y){
		//displacement to an absolute position
		this.x = x;
		this.y = y;
	}//moveTo
	
	
	this.rotate = function(alpha){
		//sets angle attribute, alpha rad CW
		this.alpha += alpha;
	}//rotate

	
	this.enableClicking = function(handleClick){ //alert('Proto.enableClicking, id='+this.id)
		this.handleClick = handleClick;
		document.onclick = Frame.handleClick;
	}//enableClicking
	
	
	this.startDraging = function(handleDrag, x, y){ //alert('startDraging x='+x+' y='+y); 
		Frame.draggedObj = this; 
		this.mouseOffsetX = this.x - x; //mouse offset rel to obj handle
		this.mouseOffsetY = this.y - y;
		this.handleDrag = handleDrag;
		document.onmousemove = Frame.handleMouseMove;
	}//startDraging
	
	
	this.stopDraging = function(){ //alert('stopDraging')
		Frame.draggedObj = null;
		document.onmousemove = null;
	}//stopDraging
	
	
	this.enableDraging = function(handleDrag){ //alert('enableDraging handleDrag='+handleDrag);
		this.handleDrag = handleDrag;
		this.enableClicking( 		
			function(x, y){//alert('click to start draging x='+x+' y='+y);
				this.startDraging(this.handleDrag, x, y);
			}//clickToStartDraging
		);
	}//enableDraging
	
	
	this.toBack = function(){ Frame.toBack(this); }
	this.toFront = function(){ Frame.toFront(this); }
	this.up = function(){ Frame.up(this); }
	this.down = function(){ Frame.down(this); }
	this.discard = function(){ Frame.discard(this); }
	
}//ProtoSprite





//*******************************************************
Rec.prototype = Frame.proto;

function Rec(x, y, w, h, col, centered, r){   //alert('Rec rouded')

// x, y: position
// w, h: widht, height
// col: fill color [optional, default 'black']
// centered: meaning of x, y [optional, default false] 
//    centered = true:  x, y is mid-point
//    centered = false: x, y is lower-left corner

	if (!col) col = 'black';
	if (!centered) centered = false;
	if (!r) r = 0;
	
	//add and initialize common properties
	initObj(this, x, y, w, h);
	
	//add and initialize of specific Rect properties
	this.centered = centered;
	this.col = col;
	this.r = r;
	

	this.fontSize = 18;	
	this.text = '';
	this.fontFamily = 'Arial';
	this.fontColor = 'black';
	this.baseLineOffs = 0; //base line offset
		
	
	
	this.write = function(txt, dy){
		if (dy) this.baseLineOffs = dy;
		this.text = txt;
	}//write
		
	
	this.setFont = function(family, size, col){
		this.fontFamily = family;
		if (size) this.fontSize = size;
		if (col) this.fontColor = col;
	}//setFont
	
	
	this.draw = function(){ //alert('Rec.draw borderColor='+this.borderColor)
		//Note: the translated origin MUST be the pivot
		if (!Frame.ctx){ alert('err: Sprite method called without frame'); return};
		
		var a90 = Math.PI/2, a180 = Math.PI, a270 = 3*Math.PI/2;
		
		//offset from handle [pivot]
		if (this.centered){
			var dx = this.w/2; var dy = this.h/2;
		} else {
			dx = 0; dy = 0;
		}
		
		var r = this.r;

			
		Frame.ctx.save();
		
		Frame.ctx.translate(Frame.X0 + this.x, Frame.Y0 - this.y);
		if (this.alpha) Frame.ctx.rotate(this.alpha);
		
		if (r!=0){
			//make path of rounde rect
			Frame.ctx.beginPath();
			Frame.ctx.arc(r-dx, -r+dy, r, a90, a180); 
			Frame.ctx.arc(r-dx, -h+r+dy, r,  a180, a270);
			Frame.ctx.arc(w-r-dx, -h+r+dy, r, a270, 0);
			Frame.ctx.arc(w-r-dx, -r+dy, r, 0, a90);
			Frame.ctx.closePath();
		}
		
		//fill rect
		if (this.col!='none'){ 
			Frame.ctx.fillStyle = this.col;
			if (r==0) Frame.ctx.fillRect(-dx, dy, this.w, -this.h);
			else Frame.ctx.fill(); 
			
		}
		//draw a border
		if (this.borderWidth){ //alert('border '+this.borderColor)
			Frame.ctx.strokeStyle = this.borderColor;
			Frame.ctx.lineWidth = this.borderWidth;
			if (r==0) Frame.ctx.strokeRect(-dx, dy, this.w, -this.h); 
			else Frame.ctx.stroke();
		}
				
		//write text
		if (this.text) {
			Frame.ctx.fillStyle = this.fontColor;
			Frame.ctx.font = this.fontSize+'px '+this.fontFamily; 
			//var txtm = Frame.ctx.measureText('kaka bussi');
			Frame.ctx.textAlign = 'center';
			Frame.ctx.fillText(	this.text, 
								-dx + this.w/2, 
								dy-this.h/2+this.fontSize/2-this.baseLineOffs
								);
		}	

		Frame.ctx.restore();
	}//draw
	

	this.isInside = function(x0, y0){ //alert('Rect.isInside x0='+x0+' y0='+y0+' alpha='+this.alpha)
		//rotate to vertical
		var P0 = rot([x0, y0], this.alpha); //the rotated test pt
		var P = rot([this.x, this.y], this.alpha); //the rotated handle
			
		var x0_ = P0[0], y0_ = P0[1];
		var x_ = P[0],   y_ = P[1];
		if (this.centered) {
			x_ = x_ - this.w/2;
			y_ = y_ - this.h/2;
		}

		return (x0_ > x_) && (x0_ < x_+this.w) && (y0_ > y_) && (y0_ < y_+this.h) ;				
	}//isInside
	
		
	Frame.register(this);
}//Rec






//*******************************************************
Disk.prototype = Frame.proto;

function Disk(x, y, r, col){ //alert('new Disk x='+x+' y='+y+' r='+r)

//x, y: position (coordinates of center)
//r: radius
//col: fill color [optional, default 'black']


	//add and initialize common properties
	initObj(this, x, y);
	
	//note: w, h undefined

	//add and initialize of specific Rect properties
	this.r = r;
	this.centered = true;
	this.col = (col? col : 'black'); //alert('Disk this.col='+this.col)
	
	
	this.draw = function(){
		 
		//alert('Disk.draw id='+this.id+' x='+this.x+' y='+this.y+' r='+this.r+' col='+this.col+' border='+style.border);
		
		if (!Frame.ctx){ alert('err: Disk method called without frame'); return};
		
		Frame.ctx.save();
		Frame.ctx.beginPath();
		Frame.ctx.arc(Frame.X0 + this.x, Frame.Y0 - this.y, this.r, 0, 2*Math.PI); 
		Frame.ctx.closePath();
		
		if (this.borderWidth){ 
			Frame.ctx.strokeStyle = this.borderColor;
			Frame.ctx.lineWidth = this.borderWidth;
			Frame.ctx.stroke(); 
		}
		
		if (this.col!='none') {
			Frame.ctx.fillStyle = this.col;
			Frame.ctx.fill();  
		}
		
		Frame.ctx.restore();		
	}//draw
	
	
	this.isInside = function(x, y){
		var dx = x - this.x;
		var dy = y - this.y;
		return dx*dx+dy*dy <= this.r*this.r
	}//isInside
	
	Frame.register(this);
}//Disk



//*******************************************************
Sprite.prototype = Frame.proto;

function Sprite(url, x, y, w, h, aligned){ //alert('Sprite');

	// url: picture source
	// x, y: coordinates of mid-point
	// w, h: widht, height
	// aligned: if true sprite always turns in direction of velocity 
	//           [optional, default false]
	
	// note: animated gif's are not animated
	// note: x, y are optional, e.g. Sprite(url, w, h, aligned)
	
	//function overloading
	if (Sprite.arguments.length<5){
		aligned = w;
		h = y;  w = x;  y = 0;  x = 0;
	}
	
	
	//add and initialize common properties
	initObj(this, x, y, w, h);
	
	//add and initialize of specific Rect properties
	this.centered = true; //always centered
	this.bearing = 0;
	this.aligned = aligned;
	
	this.img = new Image();
	this.img.parent = this;
	this.img.src = url;
	if (!this.img.complete) this.img.onload = function(){ //alert('Sprite img load')
		if (Frame.bdy) Frame.draw();
	}
	
	
	//add border capability
		
		
	this.draw = function(){ //alert('Sprite.draw id='+this.id)
		if (!Frame.ctx){ alert('err: Sprite method called without frame'); return};
		var w_2 = this.w/2;
		var h_2 = this.h/2;
		
		//bearing from north cw
		if (this.aligned) this.bearing = this.alpha + bearingRad(this.vx, this.vy);
				
		Frame.ctx.save();
		
		Frame.ctx.translate(Frame.X0 + this.x, Frame.Y0 - this.y);
		if (this.bearing) Frame.ctx.rotate(this.bearing);
		
		Frame.ctx.drawImage(this.img, -w_2, -h_2, this.w, this.h);
		
		if (this.borderWidth){ 
			Frame.ctx.strokeStyle = this.borderColor;
			Frame.ctx.lineWidth = this.borderWidth;
			Frame.ctx.strokeRect(-w_2, -h_2, w, h);  
		}

		//Frame.ctx.strokeRect(-w_2, -h_2, w, h); //draw a border around img

		Frame.ctx.restore();
	}//draw
	
	
	this.startTracking = function(){ 
		this.aligned = true; 
	}//startTracking
	
	
	this.stopTracking = function(){ 
		this.aligned = false; 
	}//stopTracking
	
	
	this.rotate = function(alpha){ //alert('rotate')
		this.alpha += alpha;
		if (!this.aligned) this.bearing = this.alpha;
	}//rotate
	
	
	this.changeSrc = function(newSrc){ //alert('Sprite.changeSrc')
		this.img.src = newSrc;
	}//changeSrc
	
	
	this.changeImg = function(newImg){
		this.img = newImg;
		if (!newImg.complete) newImg.onload = function(){ //alert('Sprite img load')
			if (Frame.bdy) Frame.draw();
		}
	}//changeImg
	
	
	this.isInside = function(x0, y0){ //alert('Rect.isInside x0='+x0+' y0='+y0+' alpha='+this.alpha)
		//rotate to vertical
		var P0 = rot([x0, y0], this.bearing); //the rotated test pt
		var P = rot([this.x, this.y], this.bearing); //the rotated handle
		
		var x0_ = P0[0], y0_ = P0[1];
		var x_ = P[0],   y_ = P[1];
		if (this.centered) {
			x_ = x_ - this.w/2;
			y_ = y_ - this.h/2;
		}
		
		return (x0_ > x_) && (x0_ < x_+this.w) && (y0_ > y_) && (y0_ < y_+this.h);				
	}//isInside

		
	Frame.register(this);		
}//Sprite





//*******************************************************
/*AniSprite.prototype = new Sprite('', 0, 0); AniSprite.prototype.discard();
 
function AniSprite(url, w, h){
	
		
	//alert('AniSprite x='+x+' y='+y+' w='+w+' h='+h+' aligned='+aligned)
	
	initObj(this, 0, 0, w, h);
	
	this.img = new Image();
	this.img.parent = this;
	this.img.src = url;
	this.img.onload = function(){ //alert('Sprite img load')
		if (Frame.bdy) this.parent.draw();
	}
	
	Frame.register(this);
}//AniSprite*/




//*******************************************************
Line.prototype = Frame.proto;

function Line(x1, y1, x2, y2, col, lineWidth, lineCap){ 

//x1, y1: start point of line
//x2, y2: end point of line
//col: line color [optinoal, default 'black']
//lineWidth: line width [optional, default 1]
//lineCap: 'butt'[default] | 'round'  [optional]

//note1: line is centered around ideal line
//note2: when 'round', click insensitive in semi-circles


	//argument overloading
	if (!col) col = 'black';
	if (!lineWidth) lineWidth = 1;
	if (!lineCap) lineCap = 'butt';  //'butt', 'round', 'square'

	initObj(this, x1, y1, x2-x1, y2-y1);
	
	//note: [x, y] is start point of line
	//[w, h] is the vector from x,y to end point	
	
	this.col = col;
	this.lineWidth = lineWidth;
	this.lineCap = lineCap;
	
	
	this.draw = function(){ 
		if (!Frame.ctx){ alert('err: Rect method called without frame'); return};
		var x2 = this.x + this.w;
		var y2 = this.y + this.h;
		
		Frame.ctx.save();

		Frame.ctx.strokeStyle = this.col;
		Frame.ctx.lineWidth = this.lineWidth;
		Frame.ctx.lineCap = this.lineCap;
		Frame.ctx.beginPath();
		Frame.ctx.moveTo(Frame.X0 + this.x, Frame.Y0 - this.y);
		Frame.ctx.lineTo(Frame.X0 + x2, Frame.Y0 - y2);
		Frame.ctx.stroke();
		Frame.ctx.closePath();
		
		Frame.ctx.restore();
	}//draw
	
	
	this.dist = function(x, y){
		//note: dist>0, x,y is on right side of line
		//      dist<0, x,y is on left side of line
				
		var d = Math.sqrt(this.w*this.w + this.h*this.h);
		return (this.h*x - this.w*y + this.y*this.w - this.x*this.h)/d;
	}//dist
	
	
	this.rotate = function(alpha){
		//this.alpha += alpha;   //alha is always 0 since the end point is changed
		
		var P = rot([this.w, this.h], -alpha);
		
		this.w = P[0];
		this.h = P[1];
	}//rotate
	
	
	this.changeTo = function(x1, y1, x2, y2){
		this.x = x1;
		this.y = y1;
		this.w = x2 - x1;
		this.h = y2 - y1;
	}//changeTo
	
	
	this.isInside = function (x, y){ //alert('Line.isInside x='+x+' y='+y)
		//note: correct for 'butt' but not for 'round' and 'square'

		var dx = this.w;//this.x2 - this.x1;
		var dy = this.h;//this.y2 - this.y1;
		var d = Math.sqrt(dx*dx + dy*dy);
		
		//sine and cosine
		var si = dy/d; 
		var co = dx/d; 
		
		//turn to horizontal
		var x1_ =  this.x*co  + this.y*si;
		var y1_ = -this.x*si  + this.y*co;
		
		var x2_ =  (this.x+this.w)*co  + (this.y+this.h)*si;
				
		var x_ =  x*co  + y*si;
		var y_ = -x*si  + y*co;
		
		return (Math.abs(y_ - y1_) < this.lineWidth/2) && (x_ > x1_)  && (x_ < x2_); 
	}//isInside
	
	Frame.register(this);
}//Line



//*****************END Sprites***************************








//******************auxiliary functions******************
//random integers
function randInt(n){
	//random integer between 0 ... n-1
	return Math.floor(Math.random()*n);
}//randInt

function randBetween(a, b){
	return a + Math.random()*(b-a);
}//randBetween


function shuffle(p){//random shuffle of array p
	var rand, temp, n;
	for (var n=p.length-1; n>0; n--){
		rand = Math.floor(Math.random()*(n+1));
		temp = p[n]; p[n] = p[rand]; p[rand] = temp;
	}//for
}//shuffle

function bearingRad(vx, vy){
	//angle of vector vx, vy to north
	//0 = 2pi = north, angle measured clockwise
	if(vx==0 && vy==0) return 0;
	var a = Math.asin(vy/Math.sqrt(vx*vx + vy*vy));
	if (vx>=0) return (Math.PI/2) - a;
	else return (3*Math.PI/2) + a;	
}//bearingRad

//get mouse coordinates from event
function getMouseX(e){
	return e.pageX - Frame.X0;
}//getMouseX

function getMouseY(e){
	return Frame.Y0 - e.pageY;
}//getMouseY

function rot(xVect, alpha){
	//rotate vector anti-clockwise
	var x = xVect[0], y = xVect[1];
	var si = Math.sin(alpha);
	var co = Math.cos(alpha);
	var x$ = co*x - si*y;
	var y$ = si*x + co*y;
	return [x$, y$];
}//rot