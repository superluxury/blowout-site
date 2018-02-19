/**********************
POLYFILLS
***********************/

// IE8 ployfill for GetComputed Style (for Responsive Script below)
if (!window.getComputedStyle) {
	window.getComputedStyle = function(el, pseudo) {
		this.el = el;
		this.getPropertyValue = function(prop) {
			var re = /(\-([a-z]){1})/g;
			if (prop == 'float') prop = 'styleFloat';
			if (re.test(prop)) {
				prop = prop.replace(re, function () {
					return arguments[2].toUpperCase();
				});
			}
			return el.currentStyle[prop] ? el.currentStyle[prop] : null;
		}
		return this;
	}
}

 // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


jQuery(document).ready(function($) {

	
	/**********************
	VARIABLES
	***********************/
	
	var	responsive_viewport_width		=	'',
		responsive_viewport_height		=	'',
		base							=	'',
		availableSlides					=	new Array(),
		prevPrevSlide					=	'#home',
		prevSlide						=	'#home',
		currentSlide					=	'#home';
	
	
	/**********************
	STARTUP ACTIONS
	***********************/
	
	//Set height of slides
	change_slide_height();
	
	
	//Create an array of all the slides
	$('#inner-content').find('.bo-page').each(function(){
			availableSlides.push( $(this).attr('id') );
	});
	
	
	//Append read more links
	$('.read-more-section').after('<a href="#" class="read-more-link">Read More &darr;</a>');
	
	
	$('#press-kit a').has('img').fancybox({
		openEffect:		'none',
    	closeEffect:	'none',
    	autoSize:		true,
    	autoHeight:		true,
    	autoWidth:		true,
    	beforeLoad : function() {
        	this.title = $(this.element).find('img').attr('alt');
   		},
    	helpers : {
    		title : {
    			type : 'inside'
    		}
    	}
	});
	
	
	/**********************
	EVENT LISTENERS
	***********************/
	
	//On resize, change slide height
	$(window).resize(function() {
		change_slide_height();
	});
	
	
	//Clicking header links
	$('.header a, #return-to-top, a.home').on('click', function(e){
		e.preventDefault();
		
		if( $(this).hasClass('home') ) {
			goto_slide( 'home' );
		} else {
		
			var the_link	=	$(this).attr('href'),
				the_link	=	the_link.substring( the_link.indexOf('.com/')+5, the_link.length-1 ),
				the_link	=	the_link.substring( the_link.indexOf('#')+1 );
		
			console.log( the_link );
		
			goto_slide( the_link );
		
		}
	});
	
	
	//Handles Scroll URL updating within rAF
	$(window).on('scroll', scroll_check);
	
	
	//Clicking on overlay to trailer
	$('.slx-video-container').on('click', function() {
		//blowout_trailer.api('play');
		//$('.video-overlay').hide();
	});
	
	
	//Clicking read more links
	$('.read-more-link').on('click', function(e){
		e.preventDefault();
		if( $(this).hasClass('activated') ) {
			$(this).prev('.read-more-section').hide('blind', 'swing', 1000);
			$(this).data('activated-text', $(this).html() ).html( $(this).data('deactivated-text') ).removeClass('activated');
		} else {
			if( $(this).data('activated-text')!= null ) {
				$(this).data('deactivated-text', $(this).html() ).html( $(this).data('activated-text') ).addClass('activated');
			} else {
				$(this).data('deactivated-text', $(this).html() ).html('Show Less &uarr;').addClass('activated');
			}
			$(this).prev('.read-more-section').show('blind', 'swing', 1000);
		}
	});
	
	
	//Listener for custom vimeo trailer thing
	 window.addEventListener('load', function() {
		//Attach the ready event to the iframe
		$f(document.getElementById('blowout_trailer')).addEvent('ready', ready);
	});
	
	
	/**********************
	FUNCTIONS
	***********************/
	
	function change_slide_height() {
		/*if( determine_aspect_ratio() < 1.333 && $(window).height() < 480 ) {
			$('#inner-content').children('.bo-page').not('#home').css('min-height', '');
			$('#home').css('min-height', $(window).height());
		} else {*/
			$('#inner-content').children('.bo-page').css('min-height', $(window).height());
		//}
	}
	
	
	function update_history_and_URL(state, title, url) {
		if(history.pushState) {
			history.pushState(state, title, url);
		}
		else {
			location.hash = url;
		}
		
		update_menu_classes(url);
	}
 	
 	
 	function update_menu_classes(current_slide) {
 		//console.log('update_menu_classes(' + currentSlide + ')');
		$('.header ul').children('li').removeClass('current-menu-item').each(function(){
				
			var	the_link	=	$(this).children('a').attr('href'),
				the_link	=	the_link.substring( the_link.indexOf('.com/')+5, the_link.length-1 ),
				the_link	=	the_link.substring( the_link.indexOf('#')+1 );
				
				//console.log('the_link is ' + the_link + ' and current_slide is ' + current_slide);
				

			if(the_link===current_slide || $(this).hasClass(current_slide.substring(current_slide.indexOf('#')+1))) {
				//console.log('they\'re equal!');
				$(this).addClass('current-menu-item');
			}
		});
 	}
 	
 	
 	function goto_slide(the_link, do_not_update_address) {
 		$(window).off('scroll', scroll_check);
 		
 		
 		$("html, body").animate({ scrollTop: $('#' + the_link).offset().top+1 }, determine_speed(the_link), function(){
 			console.log('callback after goto_slide');
 			$(window).on('scroll', scroll_check);
 		});

 		update_history_and_URL(null, null, '#' + the_link);

 	}
 	
 	
 	function determine_speed(next_slide) {
 		//console.log($(currentSlide).offset().top - $('#' + next_slide).offset().top);
 		
 		var speed = $(window).scrollTop() - $('#' + next_slide).offset().top;
 		
 		if(speed<0) {speed=-speed;}
 		
 		return speed;
 	}
 	
 	
 	function scroll_check(theCurTop) {
		console.log('scrollCheck');
		window.requestAnimationFrame(function(){
			scrollNav($(window).scrollTop());
		});
	}
	
	
	//Function for handling links and urls while scrolling
	function scrollNav(scrollTop){
	
		//Let's figure out which slide we are on
		currentSlide=determine_current_slide(scrollTop),
		currentSlide=currentSlide[0];
	
		if(currentSlide!=prevSlide) {
			update_menu_classes(currentSlide);
			prevPrevSlide = prevSlide;
			prevSlide = currentSlide;
		
			//URL Updating Procedure

			if(window.location.hash!==currentSlide) {
				update_history_and_URL(null, null, currentSlide);
			}

		
		
		}	
	}
	
	
	function determine_current_slide(e){
		//console.log('determine current slide');
		var	slidesReached	=	new Array(),
			top				=	e;

		$.each(availableSlides, function( index, value ) {
			//console.log('#' + value);
			//var top=e;

			var slideTop=$('#' + value).offset().top;
			//console.log($('#' + value).data('menu-top'));

			if(top>=slideTop) {
				slidesReached.push( $('#' + value).attr('id') );
				//console.log(slidesReached);
			}
		});
	
		//console.log('slidesReached are ' + slidesReached);
	
	
		return	[	'#' + availableSlides[slidesReached.length-1],	//Current Slide
					'#' + availableSlides[slidesReached.length-2],	//Previous Slide
					'#' + availableSlides[slidesReached.length]		//Next Slide
				];
	}
	
	
	//Detect aspect ratio of viewport
	function determine_aspect_ratio() {
		return $(window).width() / $(window).height();
	}
	
	
	//Vimeo controller
	function ready(player_id) {
		// Keep a reference to Froogaloop for this player
		var player = $f(player_id);

		$('#blowout_trailer_container .image').on('click', function() {
			player.api('play');
			$(this).parent().hide('blind', 'easeOutQuart', 1000);
		});

	}

	
}); /* end of as page load scripts */


/*! A fix for the iOS orientationchange zoom bug.
 Script by @scottjehl, rebound by @wilto.
 MIT License.
*/
(function(w){
	// This fix addresses an iOS bug, so return early if the UA claims it's something else.
	if( !( /iPhone|iPad|iPod/.test( navigator.platform ) && navigator.userAgent.indexOf( "AppleWebKit" ) > -1 ) ){ return; }
	var doc = w.document;
	if( !doc.querySelector ){ return; }
	var meta = doc.querySelector( "meta[name=viewport]" ),
		initialContent = meta && meta.getAttribute( "content" ),
		disabledZoom = initialContent + ",maximum-scale=1",
		enabledZoom = initialContent + ",maximum-scale=10",
		enabled = true,
		x, y, z, aig;
	if( !meta ){ return; }
	function restoreZoom(){
		meta.setAttribute( "content", enabledZoom );
		enabled = true; }
	function disableZoom(){
		meta.setAttribute( "content", disabledZoom );
		enabled = false; }
	function checkTilt( e ){
		aig = e.accelerationIncludingGravity;
		x = Math.abs( aig.x );
		y = Math.abs( aig.y );
		z = Math.abs( aig.z );
		// If portrait orientation and in one of the danger zones
		if( !w.orientation && ( x > 7 || ( ( z > 6 && y < 8 || z < 8 && y > 6 ) && x > 5 ) ) ){
			if( enabled ){ disableZoom(); } }
		else if( !enabled ){ restoreZoom(); } }
	w.addEventListener( "orientationchange", restoreZoom, false );
	w.addEventListener( "devicemotion", checkTilt, false );
})( this );