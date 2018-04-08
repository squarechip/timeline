function timeline(collection, options) {
  const timelines = [];
  const warningLabel = 'Timeline:';
  let winWidth = window.innerWidth;
  let resizeTimer;
  let currentIndex = 0;

  // Set default settings
  const defaultSettings = {
    mode: 'vertical',
    forceVerticalMode: 600,
    verticalStartPosition: 'left',
    visibleItems: 3
  };

  // Helper function to test whether values are an integer
  function testValues(value, settingName) {
    if (typeof value !== 'number' && value % 1 !== 0) {
      console.warn(`${warningLabel} Supplied number '${value}' for ${settingName} is not an integer.`);
      return false;
    }
    return true;
  }

  // Helper function to wrap an element in another HTML element
  function itemWrap(el, wrapper, classes) {
    wrapper.classList.add(classes);
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }

  // Helper function to wrap each element in a group with other HTML elements
  function wrapElements(items) {
    items.forEach((item) => {
      itemWrap(item.querySelector('.timeline__content'), document.createElement('div'), 'timeline__content__wrap');
      itemWrap(item.querySelector('.timeline__content__wrap'), document.createElement('div'), 'timeline__item__inner');
    });
  }

  // Helper function to check if an element is partially in the viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
      (rect.top + rect.height) >= 0 &&
      (rect.left + rect.width) >= 0
    );
  }

  // Create timelines
  function createTimelines(timelineEl) {
    const timelineName = timelineEl.id ? `#${timelineEl.id}` : `.${timelineEl.className}`;
    const errorPart = 'could not be found as a direct descendant of';
    const data = timelineEl.dataset;
    let wrap;
    let scroller;
    let items;
    let {
      mode, verticalStartPosition, forceVerticalMode, visibleItems
    } = defaultSettings;
    if (data.mode) {
      ({ mode } = data);
    } else if (options && options.mode) {
      ({ mode } = options);
    }
    if (data.verticalStartPosition) {
      ({ verticalStartPosition } = data);
    } else if (options && options.verticalStartPosition) {
      ({ verticalStartPosition } = options);
    }
    if (data.forceVerticalMode) {
      ({ forceVerticalMode } = data);
    } else if (options && options.forceVerticalMode) {
      ({ forceVerticalMode } = options);
    }
    if (data.visibleItems) {
      ({ visibleItems } = data);
    } else if (options && options.visibleItems) {
      ({ visibleItems } = options);
    }

    if (mode !== 'horizontal' && mode !== 'vertical') {
      console.warn(`${warningLabel}The mode '${mode}' was not recognised`);
      ({ mode } = defaultSettings);
    }

    if (verticalStartPosition !== 'left' && verticalStartPosition !== 'right') {
      console.warn(`${warningLabel}The start position '${verticalStartPosition}' was not recognised`);
      ({ verticalStartPosition } = defaultSettings);
    }

    if (!forceVerticalMode || !testValues(forceVerticalMode, "'forceVerticalMode'")) {
      ({ forceVerticalMode } = defaultSettings);
    }

    if (!visibleItems || !testValues(visibleItems, "'visibleItems'")) {
      ({ visibleItems } = defaultSettings);
    }

    try {
      wrap = timelineEl.querySelector('.timeline__wrap');
      if (!wrap) {
        throw new Error(`${warningLabel}.timeline__wrap ${errorPart} ${timelineName}`);
      } else {
        scroller = wrap.querySelector('.timeline__items');
        if (!scroller) {
          throw new Error(`${warningLabel}.timeline__items ${errorPart} .timeline__wrap`);
        } else {
          items = [].slice.call(scroller.children, 0);
        }
      }
    } catch (e) {
      console.warn(e.message);
      return false;
    }

    timelines.push({
      timelineEl,
      wrap,
      scroller,
      mode,
      verticalStartPosition,
      items,
      visibleItems,
      forceVerticalMode
    });
  }

  if (collection.length) {
    [].forEach.call(collection, createTimelines);
  }

  // Set height and widths of timeline elements and viewport
  function setHeightandWidths(tl) {
    // Set widths of items and viewport
    function setWidths() {
      tl.itemWidth = tl.wrap.offsetWidth / tl.visibleItems;
      tl.items.forEach((item) => {
        item.style.width = `${tl.itemWidth}px`;
      });
      tl.scrollerWidth = tl.itemWidth * tl.items.length;
      tl.scroller.style.width = `${tl.scrollerWidth}px`;
    }

    // Set height of items and viewport
    function setHeights() {
      let oddIndexTallest = 0;
      let evenIndexTallest = 0;
      tl.items.forEach((item, i) => {
        item.style.height = 'auto';
        const height = item.offsetHeight;
        if (i % 2 === 0) {
          evenIndexTallest = height > evenIndexTallest ? height : evenIndexTallest;
        } else {
          oddIndexTallest = height > oddIndexTallest ? height : oddIndexTallest;
        }
      });
      tl.items.forEach((item, i) => {
        if (i % 2 === 0) {
          item.style.height = `${evenIndexTallest}px`;
        } else {
          item.style.height = `${oddIndexTallest}px`;
          item.style.transform = `translateY(${evenIndexTallest}px)`;
        }
      });
      tl.scroller.style.height = `${evenIndexTallest + oddIndexTallest}px`;
    }

    if (window.innerWidth > tl.forceVerticalMode) {
      setWidths();
      setHeights();
    }
  }

  // Create and add arrow controls to horizontal timeline
  function addNavigation(tl) {
    if (tl.items.length > tl.visibleItems) {
      const prevArrow = document.createElement('button');
      const nextArrow = document.createElement('button');
      const topPosition = tl.items[0].offsetHeight;
      prevArrow.className = 'timeline-nav-button timeline-nav-button--prev';
      nextArrow.className = 'timeline-nav-button timeline-nav-button--next';
      prevArrow.textContent = 'Previous';
      nextArrow.textContent = 'Next';
      prevArrow.style.top = `${topPosition}px`;
      nextArrow.style.top = `${topPosition}px`;
      if (currentIndex === 0) {
        prevArrow.disabled = true;
      } else if (currentIndex + 1 === tl.items.length) {
        nextArrow.disabled = true;
      }
      tl.timelineEl.appendChild(prevArrow);
      tl.timelineEl.appendChild(nextArrow);
    }
  }

  // Add the centre line to the horizontal timeline
  function addHorizontalDivider(tl) {
    if (tl.timelineEl.querySelector('.timeline-divider')) {
      tl.timelineEl.querySelector('.timeline-divider').remove();
    }
    const topPosition = tl.items[0].offsetHeight;
    const horizontalDivider = document.createElement('span');
    horizontalDivider.className = 'timeline-divider';
    horizontalDivider.style.top = `${topPosition}px`;
    tl.timelineEl.appendChild(horizontalDivider);
  }

  // Calculate the new position of the horizontal timeline
  function timelinePosition(tl) {
    const position = tl.items[currentIndex].offsetLeft;
    const str = `translate3d(-${position}px, 0, 0)`;
    tl.scroller.style.webkitTransform = str;
    tl.scroller.style.msTransform = str;
    tl.scroller.style.transform = str;
  }

  // Make the horizontal timeline slide
  function slideTimeline(tl) {
    const navArrows = tl.timelineEl.querySelectorAll('.timeline-nav-button');
    const arrowPrev = tl.timelineEl.querySelector('.timeline-nav-button--prev');
    const arrowNext = tl.timelineEl.querySelector('.timeline-nav-button--next');
    const maxIndex = tl.items.length - tl.visibleItems;
    [].forEach.call(navArrows, (arrow) => {
      arrow.addEventListener('click', function(e) {
        e.preventDefault();
        currentIndex = this.classList.contains('timeline-nav-button--next') ? (currentIndex += 1) : (currentIndex -= 1);
        if (currentIndex === 0) {
          arrowPrev.disabled = true;
          arrowNext.disabled = false;
        } else if (currentIndex === maxIndex) {
          arrowPrev.disabled = false;
          arrowNext.disabled = true;
        } else {
          arrowPrev.disabled = false;
          arrowNext.disabled = false;
        }
        timelinePosition(tl);
      });
    });
  }

  // Set up horizontal timeline
  function setUpHorinzontalTimeline(tl) {
    tl.timelineEl.classList.add('timeline--horizontal');
    setHeightandWidths(tl);
    timelinePosition(tl);
    addNavigation(tl);
    addHorizontalDivider(tl);
    slideTimeline(tl);
  }

  // Set up vertical timeline
  function setUpVerticalTimeline(tl) {
    let lastVisibleIndex = 0;
    tl.items.forEach((item, i) => {
      item.classList.remove('animated', 'fadeIn');
      if (!isElementInViewport(item) && i > 0) {
        item.classList.add('animated');
      } else {
        lastVisibleIndex = i;
      }
      const divider = tl.verticalStartPosition === 'left' ? 1 : 0;
      if (i % 2 === divider && window.innerWidth > defaultSettings.forceVerticalMode) {
        item.classList.add('timeline__item--right');
      } else {
        item.classList.add('timeline__item--left');
      }
    });
    for (let i = 0; i < lastVisibleIndex; i += 1) {
      tl.items[i].classList.remove('animated', 'fadeIn');
    }
    // Bring elements into view as the page is scrolled
    window.addEventListener('scroll', () => {
      tl.items.forEach((item) => {
        if (isElementInViewport(item)) {
          item.classList.add('fadeIn');
        }
      });
    });
  }

  // Reset timelines
  function resetTimelines(tl) {
    currentIndex = 0;
    tl.timelineEl.classList.remove('timeline--horizontal', 'timeline--mobile');
    tl.scroller.removeAttribute('style');
    tl.items.forEach((item) => {
      item.removeAttribute('style');
      item.classList.remove('animated', 'fadeIn', 'timeline__item--left', 'timeline__item--right');
    });
    const navArrows = tl.timelineEl.querySelectorAll('.timeline-nav-button');
    [].forEach.call(navArrows, (arrow) => {
      arrow.parentNode.removeChild(arrow);
    });
  }

  // Set up the timelines
  function setUpTimelines() {
    timelines.forEach((tl) => {
      tl.timelineEl.style.opacity = 0;
      if (!tl.timelineEl.classList.contains('timeline--loaded')) {
        wrapElements(tl.items);
      }
      resetTimelines(tl);
      if (window.innerWidth <= tl.forceVerticalMode) {
        tl.timelineEl.classList.add('timeline--mobile');
      }
      if (tl.mode === 'horizontal' && window.innerWidth > tl.forceVerticalMode) {
        setUpHorinzontalTimeline(tl);
      } else {
        setUpVerticalTimeline(tl);
      }
      tl.timelineEl.classList.add('timeline--loaded');
      setTimeout(() => {
        tl.timelineEl.style.opacity = 1;
      }, 500);
    });
  }

  // Initialise the timelines on the page
  setUpTimelines();

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newWinWidth = window.innerWidth;
      if (newWinWidth !== winWidth) {
        setUpTimelines();
        winWidth = newWinWidth;
      }
    }, 250);
  });
}

if (window.jQuery) {
  (($) => {
    $.fn.timeline = function(opts) {
      timeline(this, opts);
      return this;
    };
  })(window.jQuery);
}
