// JavaScript Document

/** A modal pop-up.
	
	DOCUMENTATION OUTDATED!
	
	Basic usage.
	
    --------------------------------------------------------------------
	HTML elemets that the plugin will create on document ready.
	
	<!--
		An overlay that will act as a background for the pop-ups.
		Only one will be added to the DOM.
	 -->
	<div id="lighterBoxPopifyOverlay" class="lighterBoxPopifyHide"><!-- Empty. --></div>
	
	<!--
		A wrapper element for each pop-up's content.
	-->
	<div class="lighterBoxPopifyOverlayContent" class="lighterBoxPopifyHide">
		
	</div>
	
	--------------------------------------------------------------------
	The following options can be pased to the plugin:
	
	Option name: default value
	opacity: 1
		The popup's background opacity.
		
	minY: 0
		The highest the pop-up can follow the scroll vertically
		relative to the document.
		
	maxY: $(document).height() - popup.height()
		The lowest the pop-up can follow the scroll vertically
		relative to the document.
	
	--------------------------------------------------------------------
	The pop-up's wrapper element ('.lighterBoxPopifyOverlayContent') will respond
	to the following events:
	
	lighterBox-popify-show:
		Displays the pop-up.
	
	lighterBox-popify-hide:
		Hides the pop-up.
	
	There are 2 (two) helper plugin functions: popifyOpen and popifyClose.
	They, respectivley open and close the pop-ups they're invoked on.
	Note that these helper functions can be called on the .lighterBoxPopifyOverlayContent
	elements themselves or any descendant elements.
	
	<code>
		// Popify some content.
		$('#content').popify();
		
		// Will open the pop-up in which the a elements reside.
		$('#content .comeClass a').popifyOpen();
		
		// Same as the above.
		$('#content').popifyClose();
		
		// Will open all pop-ups.
		$('.lighterBoxPopifyOverlayContent').popifyOpen();
	</code>
	
 */
(function($){
  // Private helper prototypes follow.
  
  // Simple 2 dimensional point class.
  function Point(x, y) {
    if (x && 'number' == typeof x) {
      this.x = x;
    }
    
    if (y && 'number' == typeof y) {
      this.y = y;
    }
  };
  Point.prototype = {
    x: 0,
    y: 0
  };
  
  function Rectangle(p1, p2, p3, p4) {
    if (p1 && 'number' == typeof p1) {
      this.p1 = p1;
    }
    
    if (p2 && 'number' == typeof p2) {
      this.p2 = p2;
    }
    
    if (p3 && 'number' == typeof p3) {
      this.p3 = p3;
    }
    
    if (p4 && 'number' == typeof p4) {
      this.p4 = p4;
    }
  }
  Rectangle.prototype = {
      p1: new Point(0, 0),
      p2: new Point(0, 0),
      p3: new Point(0, 0),
      p4: new Point(0, 0)
  };
  
  function ViewPort() {};
  ViewPort.prototype = {
    width: function() {
      return $(window).width();
    },
    height: function() {
      return $(window).height();
    },
    
    p1: function() {
      return new Point(
        $(window).scrollLeft(),
        $(window).scrollTop()
      );
    },
    p2: function() {
      return new Point(
        $(window).scrollLeft() + $(window).width(),
        $(window).scrollTop()
      );
    },
    p3: function() {
      return new Point(
        $(window).scrollLeft() + $(window).width(),
        $(window).scrollTop() + $(window).height()
      );
    },
    p4: function() {
      return new Point(
        $(window).scrollLeft(),
        $(window).scrollTop() + $(window).height()
      );
    }
  };
  
	// Default options.
	var defaultSettings = {
    overlayStyle: {
      'display': 'none',
      'position': 'absolute',
      'top': '0',
      'left': '0'
    },
    
    contentStyle: {
      'display': 'none',
      'position': 'absolute',
      'top': '0',
      'left': '0'
    },
    
		// Follow scrolling.
		follow: true,
		
		// The highest the pop-up can follow the scroll vertically.
		minY: 0,
		// The lowest the pop-up can follow the scroll vertically.
		maxY: null, // Note that this is just a temp. Will get calculated for each individual pop-up.
		
		minX: 0,
		maxX: null
	};
	
	function showLightbox(e) {
		var settings = $(this).data('settings');
		var overlay = $(this).data('overlay');
		
		$(overlay)
			.removeClass('lighterBoxPopifyHide')
			.stop(true)
			.clearQueue()
			.show();
		
		if (settings.overlayStyle.opacity) {
			$(overlay)
  			.css({
  				opacity: 0
  			})
  			.animate({
  				opacity: settings.overlayStyle.opacity
  			});
		}
		
		$(this)
			.removeClass('lighterBoxPopifyHide')
			.stop(true)
			.clearQueue()
			.show()
			.fadeIn();
			//.css({opacity: 0})
      //.animate({opacity: 1}, 1000);
		
    onWindowScrollResize(this, false);
	};
	
	function hideLightbox(e) {
		var overlayContent = $(this);
    var overlay = $(this).data('overlay');
		var settings = $(this).data('settings');
		
		$(this)
			.addClass('lighterBoxPopifyHide')
			.stop(true)
			.clearQueue()
			.fadeOut();
		
		$(overlay)
			.addClass('lighterBoxPopifyHide')
			.stop(true)
			.clearQueue();
    
		if (settings.overlayStyle.opacity) {
			$(overlay).fadeOut();
		} else {
			$(overlay).hide();
		}
	};
	
	// Setup overly on window resize.
	function onWindowResize(e) {
		$('.lighterBoxPopifyOverlay')
			.width($(document).width())
			.height($(document).height());
	};
	
	function onWindowScrollResize(popup, animate) {
	  animate = (undefined == animate) ? true : animate;
	  popup = $(popup);
	  
	  // Make sure the object is copied, otherwise we're modifing
    // the element's settings variable.
    var settings = popup.data('settings');
    
    // Make sure used settings are correct.
    if (!settings.maxY) {
      settings.maxY = $(document).height() - $(popup).height();
    }
    
    var viewport = new ViewPort();
    
    /**************************************************************************/
    // Process horizontal.
    // Get the center X relative to the window's width.
    
    var toX = 0;
    var x = 0;
    
    if (popup.width() < $(window).width()) {
      x = parseInt($(window).width()/2);
      x -= parseInt(popup.width()/2);
      
      toX = $(window).scrollLeft() + x;
      
    }
    
    /**************************************************************************/
    // Process vertical.
    var toY = $(popup).offset().top; //parseInt($(popup).css('top'));
    
    // Normal case - popup fits view port. 
    if (popup.height() < $(window).height()) {
      // Get the center Y relative to the viewport's height.
      var y = parseInt($(window).height()/2);
      y -= parseInt(popup.height()/2);
      
      // Translate to document space.
      toY = $(window).scrollTop() + y;
      
      // Get bottom line relative to the viewport.
      var vpBottom = y + popup.height();
      
      if (vpBottom > $(window).height()) {
        toY -= (vpBottom - $(window).height());
      }
    // Special case - popup DOES NOT fit viewport.
    } else {
      var margin = 36;
      if ($(window).scrollTop() + margin < toY) {
        toY = $(window).scrollTop() + margin;
      } else if ((($(window).scrollTop() + $(window).height()) - margin) > (toY + popup.height())) {
        toY = (($(window).scrollTop() + $(window).height()) - margin) - popup.height();
      }
    }
    
    // Upper bound.
    if (settings.minY > toY) {
      toY = settings.minY;
    }
    
    // Lower bound.
    if (settings.maxY <= toY) {
      //toY = $(document).height() - popup.height() - 1;
      toY = settings.maxY - 1;
    }
    
    var styleProperties = {top: toY, left: toX};
    if (settings.opacity) {
      styleProperties.opacity = 1;
    }
    
    popup
      //.css('top', to + 'px');
      .stop(true)
      .clearQueue();
    
    if (animate) {
      popup.animate(styleProperties, 500);
    } else {
      popup.css(styleProperties);
    }
	};
	
	$.fn.popifyOpen = function(options) {
		var settings = $.extend(true,
			// No settings for popifyOpen.
			{},
			// User supplied.
			options
		);
		
		$(this).trigger('lighterBox-popify-show');
		return this;
	};
	
	$.fn.popifyClose = function(options) {
		var settings = $.extend(true,
			// No settings for popifyClse.
			{},
			// User supplied.
			options
		);
		
		$(this).trigger('lighterBox-popify-hide');
		return this;
	};
	
	$.fn.popify = function(options) {
	  console.log('popify: ' + $(this).attr('id'));
    
    // Merge (deep) user settings to defaults and produce
    // the global settings for this invokation.
	  var tmp = $.extend(true, {}, defaultSettings);
    var settings = $.extend(true,
      tmp, // User supplied.
      options
    );
		
	  this.each(function(i, content) {
	    var overlay = $('<div class="lighterBoxPopifyOverlay lighterBoxPopifyHide"><!-- Empty. --></div>').appendTo('body');
			var overlayContent = null;
			// Copy global settings.
			var tempSettings = $.extend({}, settings);
			
      $(overlay)
        .data('content', content)
        .css('z-index', $.fn.popify.overlayIndex++)
        .applyCss(tempSettings.overlayStyle)
        .bind('click', function(e) {
          $($(this).data('content'))
            .trigger('lighterBox-popify-hide');
        });
      
			// Setup max bottom.
			if (tempSettings.maxY) {
				tempSettings.maxY = tempSettings.maxY - $(content).height();
				if (0 >= tempSettings.maxY ) {
					tempSettings.maxY = 1;
				}
			}
			
			// Setup max right.
      if (tempSettings.maxX) {
        tempSettings.maxX = tempSettings.maxX - $(content).height();
        if (0 >= tempSettings.maxX ) {
          tempSettings.maxX = 1;
        }
      }
			
			// Wrap in jQuery object.
			content = $(content);
			// Save the settings.
			content
				.detach();
			
			overlayContent = $('<div class="lighterBoxPopifyOverlayContent" class="lighterBoxPopifyHide"></div>')
				.appendTo('body')
				.data('settings', tempSettings)
				.data('overlay', overlay)
				.bind('lighterBox-popify-show', showLightbox)
				.bind('lighterBox-popify-hide', hideLightbox)
        .css('z-index', $.fn.popify.overlayIndex++)
        .applyCss(tempSettings.contentStyle)
        .append(content);
	    
      if (!settings.follow) {
        onWindowScrollResize(overlayContent);
      }
		});
		
    onWindowResize();
		
		return this;
	};
	$.fn.popify.overlayIndex = 9000;
	
	/**
	 * Object containing css properties to set to all selected elements.
	 * Example:
	 * {
	 *   'background-position': '10px 0',
	 *   'z-index': 900
	 * }
	 */
  $.fn.applyCss = function(css) {
    $(this).each(function(i, elem){
      for(var prop in css) {
        $(elem).css(prop, css[prop]);
      }
    });
    
    return this;
  };
	
	// These are the global actions and event handlers that have
	// to be carried out / defined before the plugin is invoked.
	$(document).ready(function(e){
		$(window)
			.bind('resize', onWindowResize)
			.bind('resize scroll', function(e) {
				var popups = $('.lighterBoxPopifyOverlayContent').not('.lighterBoxPopifyHide');
				$(popups).each(function(i, popup) {
  				if ($(popup).data('settings').follow) {
  					onWindowScrollResize(popup);
  				}
				});
			});
	});
})(jQuery);
