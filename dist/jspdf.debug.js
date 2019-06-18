(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}(function () { 'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  /**
   * Creates new jsPDF document object instance.
   * @name jsPDF
   * @class
   * @param orientation {string/Object} Orientation of the first page. Possible values are "portrait" or "landscape" (or shortcuts "p" (Default), "l").<br />
   * Can also be an options object.
   * @param unit {string}  Measurement unit to be used when coordinates are specified.<br />
   * Possible values are "pt" (points), "mm" (Default), "cm", "in" or "px".
   * @param format {string/Array} The format of the first page. Can be:<ul><li>a0 - a10</li><li>b0 - b10</li><li>c0 - c10</li><li>dl</li><li>letter</li><li>government-letter</li><li>legal</li><li>junior-legal</li><li>ledger</li><li>tabloid</li><li>credit-card</li></ul><br />
   * Default is "a4". If you want to use your own format just pass instead of one of the above predefined formats the size as an number-array, e.g. [595.28, 841.89]
   * @returns {jsPDF} jsPDF-instance
   * @description
   * If the first parameter (orientation) is an object, it will be interpreted as an object of named parameters
   * ```
   * {
   *  orientation: 'p',
   *  unit: 'mm',
   *  format: 'a4',
   *  hotfixes: [] // an array of hotfix strings to enable
   * }
   * ```
   */
  var jsPDF = function (global) {
    /**
     * jsPDF's Internal PubSub Implementation.
     * Backward compatible rewritten on 2014 by
     * Diego Casorran, https://github.com/diegocr
     *
     * @class
     * @name PubSub
     * @ignore
     */

    function PubSub(context) {
      if (_typeof(context) !== 'object') {
        throw new Error('Invalid Context passed to initialize PubSub (jsPDF-module)');
      }

      var topics = {};

      this.subscribe = function (topic, callback, once) {
        once = once || false;

        if (typeof topic !== 'string' || typeof callback !== 'function' || typeof once !== 'boolean') {
          throw new Error('Invalid arguments passed to PubSub.subscribe (jsPDF-module)');
        }

        if (!topics.hasOwnProperty(topic)) {
          topics[topic] = {};
        }

        var token = Math.random().toString(35);
        topics[topic][token] = [callback, !!once];
        return token;
      };

      this.unsubscribe = function (token) {
        for (var topic in topics) {
          if (topics[topic][token]) {
            delete topics[topic][token];

            if (Object.keys(topics[topic]).length === 0) {
              delete topics[topic];
            }

            return true;
          }
        }

        return false;
      };

      this.publish = function (topic) {
        if (topics.hasOwnProperty(topic)) {
          var args = Array.prototype.slice.call(arguments, 1),
              tokens = [];

          for (var token in topics[topic]) {
            var sub = topics[topic][token];

            try {
              sub[0].apply(context, args);
            } catch (ex) {
              if (global.console) {
                console.error('jsPDF PubSub Error', ex.message, ex);
              }
            }

            if (sub[1]) tokens.push(token);
          }

          if (tokens.length) tokens.forEach(this.unsubscribe);
        }
      };

      this.getTopics = function () {
        return topics;
      };
    }
    /**
     * @constructor
     * @private
     */


    function jsPDF(options) {
      var unit = arguments[1];
      var format = arguments[2];
      var compressPdf = arguments[3];
      var filters = [];
      var userUnit = 1.0;
      var orientation = typeof options === 'string' ? options : 'p';
      options = options || {};

      if (_typeof(options) === 'object') {
        orientation = options.orientation;
        unit = options.unit || unit;
        format = options.format || format;
        compressPdf = options.compress || options.compressPdf || compressPdf;
        filters = options.filters || (compressPdf === true ? ['FlateEncode'] : filters);
        userUnit = typeof options.userUnit === "number" ? Math.abs(options.userUnit) : 1.0;
      }

      unit = unit || 'mm';
      orientation = ('' + (orientation || 'P')).toLowerCase();
      var putOnlyUsedFonts = options.putOnlyUsedFonts || true;
      var usedFonts = {};
      var API = {
        internal: {},
        __private__: {}
      };
      API.__private__.PubSub = PubSub;
      var pdfVersion = '1.3';

      var getPdfVersion = API.__private__.getPdfVersion = function () {
        return pdfVersion;
      };

      var setPdfVersion = API.__private__.setPdfVersion = function (value) {
        pdfVersion = value;
      }; // Size in pt of various paper formats


      var pageFormats = {
        'a0': [2383.94, 3370.39],
        'a1': [1683.78, 2383.94],
        'a2': [1190.55, 1683.78],
        'a3': [841.89, 1190.55],
        'a4': [595.28, 841.89],
        'a5': [419.53, 595.28],
        'a6': [297.64, 419.53],
        'a7': [209.76, 297.64],
        'a8': [147.40, 209.76],
        'a9': [104.88, 147.40],
        'a10': [73.70, 104.88],
        'b0': [2834.65, 4008.19],
        'b1': [2004.09, 2834.65],
        'b2': [1417.32, 2004.09],
        'b3': [1000.63, 1417.32],
        'b4': [708.66, 1000.63],
        'b5': [498.90, 708.66],
        'b6': [354.33, 498.90],
        'b7': [249.45, 354.33],
        'b8': [175.75, 249.45],
        'b9': [124.72, 175.75],
        'b10': [87.87, 124.72],
        'c0': [2599.37, 3676.54],
        'c1': [1836.85, 2599.37],
        'c2': [1298.27, 1836.85],
        'c3': [918.43, 1298.27],
        'c4': [649.13, 918.43],
        'c5': [459.21, 649.13],
        'c6': [323.15, 459.21],
        'c7': [229.61, 323.15],
        'c8': [161.57, 229.61],
        'c9': [113.39, 161.57],
        'c10': [79.37, 113.39],
        'dl': [311.81, 623.62],
        'letter': [612, 792],
        'government-letter': [576, 756],
        'legal': [612, 1008],
        'junior-legal': [576, 360],
        'ledger': [1224, 792],
        'tabloid': [792, 1224],
        'credit-card': [153, 243]
      };

      var getPageFormats = API.__private__.getPageFormats = function () {
        return pageFormats;
      };

      var getPageFormat = API.__private__.getPageFormat = function (value) {
        return pageFormats[value];
      };

      if (typeof format === "string") {
        format = getPageFormat(format);
      }

      format = format || getPageFormat('a4');

      var f2 = API.f2 = API.__private__.f2 = function (number) {
        if (isNaN(number)) {
          throw new Error('Invalid argument passed to jsPDF.f2');
        }

        return number.toFixed(2); // Ie, %.2f
      };

      var f3 = API.__private__.f3 = function (number) {
        if (isNaN(number)) {
          throw new Error('Invalid argument passed to jsPDF.f3');
        }

        return number.toFixed(3); // Ie, %.3f
      };

      var fileId = '00000000000000000000000000000000';

      var getFileId = API.__private__.getFileId = function () {
        return fileId;
      };

      var setFileId = API.__private__.setFileId = function (value) {
        value = value || "12345678901234567890123456789012".split('').map(function () {
          return "ABCDEF0123456789".charAt(Math.floor(Math.random() * 16));
        }).join('');
        fileId = value;
        return fileId;
      };
      /**
       * @name setFileId
       * @memberOf jsPDF
       * @function
       * @instance
       * @param {string} value GUID.
       * @returns {jsPDF}
       */


      API.setFileId = function (value) {
        setFileId(value);
        return this;
      };
      /**
       * @name getFileId
       * @memberOf jsPDF
       * @function
       * @instance
       *
       * @returns {string} GUID.
       */


      API.getFileId = function () {
        return getFileId();
      };

      var creationDate;

      var convertDateToPDFDate = API.__private__.convertDateToPDFDate = function (parmDate) {
        var result = '';
        var tzoffset = parmDate.getTimezoneOffset(),
            tzsign = tzoffset < 0 ? '+' : '-',
            tzhour = Math.floor(Math.abs(tzoffset / 60)),
            tzmin = Math.abs(tzoffset % 60),
            timeZoneString = [tzsign, padd2(tzhour), "'", padd2(tzmin), "'"].join('');
        result = ['D:', parmDate.getFullYear(), padd2(parmDate.getMonth() + 1), padd2(parmDate.getDate()), padd2(parmDate.getHours()), padd2(parmDate.getMinutes()), padd2(parmDate.getSeconds()), timeZoneString].join('');
        return result;
      };

      var convertPDFDateToDate = API.__private__.convertPDFDateToDate = function (parmPDFDate) {
        var year = parseInt(parmPDFDate.substr(2, 4), 10);
        var month = parseInt(parmPDFDate.substr(6, 2), 10) - 1;
        var date = parseInt(parmPDFDate.substr(8, 2), 10);
        var hour = parseInt(parmPDFDate.substr(10, 2), 10);
        var minutes = parseInt(parmPDFDate.substr(12, 2), 10);
        var seconds = parseInt(parmPDFDate.substr(14, 2), 10);
        var timeZoneHour = parseInt(parmPDFDate.substr(16, 2), 10);
        var timeZoneMinutes = parseInt(parmPDFDate.substr(20, 2), 10);
        var resultingDate = new Date(year, month, date, hour, minutes, seconds, 0);
        return resultingDate;
      };

      var setCreationDate = API.__private__.setCreationDate = function (date) {
        var tmpCreationDateString;
        var regexPDFCreationDate = /^D:(20[0-2][0-9]|203[0-7]|19[7-9][0-9])(0[0-9]|1[0-2])([0-2][0-9]|3[0-1])(0[0-9]|1[0-9]|2[0-3])(0[0-9]|[1-5][0-9])(0[0-9]|[1-5][0-9])(\+0[0-9]|\+1[0-4]|\-0[0-9]|\-1[0-1])\'(0[0-9]|[1-5][0-9])\'?$/;

        if (typeof date === "undefined") {
          date = new Date();
        }

        if (_typeof(date) === "object" && Object.prototype.toString.call(date) === "[object Date]") {
          tmpCreationDateString = convertDateToPDFDate(date);
        } else if (regexPDFCreationDate.test(date)) {
          tmpCreationDateString = date;
        } else {
          throw new Error('Invalid argument passed to jsPDF.setCreationDate');
        }

        creationDate = tmpCreationDateString;
        return creationDate;
      };

      var getCreationDate = API.__private__.getCreationDate = function (type) {
        var result = creationDate;

        if (type === "jsDate") {
          result = convertPDFDateToDate(creationDate);
        }

        return result;
      };
      /**
       * @name setCreationDate
       * @memberOf jsPDF
       * @function
       * @instance
       * @param {Object} date
       * @returns {jsPDF}
       */


      API.setCreationDate = function (date) {
        setCreationDate(date);
        return this;
      };
      /**
       * @name getCreationDate
       * @memberOf jsPDF
       * @function
       * @instance
       * @param {Object} type
       * @returns {Object}
       */


      API.getCreationDate = function (type) {
        return getCreationDate(type);
      };

      var padd2 = API.__private__.padd2 = function (number) {
        return ('0' + parseInt(number)).slice(-2);
      };

      var outToPages = !1; // switches where out() prints. outToPages true = push to pages obj. outToPages false = doc builder content

      var pages = [];
      var content = [];
      var currentPage;
      var content_length = 0;
      var customOutputDestination;

      var setOutputDestination = API.__private__.setCustomOutputDestination = function (destination) {
        customOutputDestination = destination;
      };

      var resetOutputDestination = API.__private__.resetCustomOutputDestination = function (destination) {
        customOutputDestination = undefined;
      };

      var out = API.__private__.out = function (string) {
        var writeArray;
        string = typeof string === "string" ? string : string.toString();

        if (typeof customOutputDestination === "undefined") {
          writeArray = outToPages ? pages[currentPage] : content;
        } else {
          writeArray = customOutputDestination;
        }

        writeArray.push(string);

        if (!outToPages) {
          content_length += string.length + 1;
        }

        return writeArray;
      };

      var write = API.__private__.write = function (value) {
        return out(arguments.length === 1 ? value.toString() : Array.prototype.join.call(arguments, ' '));
      };

      var getArrayBuffer = API.__private__.getArrayBuffer = function (data) {
        var len = data.length,
            ab = new ArrayBuffer(len),
            u8 = new Uint8Array(ab);

        while (len--) {
          u8[len] = data.charCodeAt(len);
        }

        return ab;
      };

      var standardFonts = [['Helvetica', "helvetica", "normal", 'WinAnsiEncoding'], ['Helvetica-Bold', "helvetica", "bold", 'WinAnsiEncoding'], ['Helvetica-Oblique', "helvetica", "italic", 'WinAnsiEncoding'], ['Helvetica-BoldOblique', "helvetica", "bolditalic", 'WinAnsiEncoding'], ['Courier', "courier", "normal", 'WinAnsiEncoding'], ['Courier-Bold', "courier", "bold", 'WinAnsiEncoding'], ['Courier-Oblique', "courier", "italic", 'WinAnsiEncoding'], ['Courier-BoldOblique', "courier", "bolditalic", 'WinAnsiEncoding'], ['Times-Roman', "times", "normal", 'WinAnsiEncoding'], ['Times-Bold', "times", "bold", 'WinAnsiEncoding'], ['Times-Italic', "times", "italic", 'WinAnsiEncoding'], ['Times-BoldItalic', "times", "bolditalic", 'WinAnsiEncoding'], ['ZapfDingbats', "zapfdingbats", "normal", null], ['Symbol', "symbol", "normal", null]];

      var getStandardFonts = API.__private__.getStandardFonts = function (data) {
        return standardFonts;
      };

      var activeFontSize = options.fontSize || 16;
      /**
       * Sets font size for upcoming text elements.
       *
       * @param {number} size Font size in points.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setFontSize
       */

      var setFontSize = API.__private__.setFontSize = API.setFontSize = function (size) {
        activeFontSize = size;
        return this;
      };
      /**
       * Gets the fontsize for upcoming text elements.
       *
       * @function
       * @instance
       * @returns {number}
       * @memberOf jsPDF
       * @name getFontSize
       */


      var getFontSize = API.__private__.getFontSize = API.getFontSize = function () {
        return activeFontSize;
      };

      var R2L = options.R2L || false;
      /**
       * Set value of R2L functionality.
       *
       * @param {boolean} value
       * @function
       * @instance
       * @returns {jsPDF} jsPDF-instance
       * @memberOf jsPDF
       * @name setR2L
       */

      var setR2L = API.__private__.setR2L = API.setR2L = function (value) {
        R2L = value;
        return this;
      };
      /**
       * Get value of R2L functionality.
       *
       * @function
       * @instance
       * @returns {boolean} jsPDF-instance
       * @memberOf jsPDF
       * @name getR2L
       */


      var getR2L = API.__private__.getR2L = API.getR2L = function (value) {
        return R2L;
      };

      var zoomMode; // default: 1;

      var setZoomMode = API.__private__.setZoomMode = function (zoom) {
        var validZoomModes = [undefined, null, 'fullwidth', 'fullheight', 'fullpage', 'original'];

        if (/^\d*\.?\d*\%$/.test(zoom)) {
          zoomMode = zoom;
        } else if (!isNaN(zoom)) {
          zoomMode = parseInt(zoom, 10);
        } else if (validZoomModes.indexOf(zoom) !== -1) {
          zoomMode = zoom;
        } else {
          throw new Error('zoom must be Integer (e.g. 2), a percentage Value (e.g. 300%) or fullwidth, fullheight, fullpage, original. "' + zoom + '" is not recognized.');
        }
      };

      var getZoomMode = API.__private__.getZoomMode = function () {
        return zoomMode;
      };

      var pageMode; // default: 'UseOutlines';

      var setPageMode = API.__private__.setPageMode = function (pmode) {
        var validPageModes = [undefined, null, 'UseNone', 'UseOutlines', 'UseThumbs', 'FullScreen'];

        if (validPageModes.indexOf(pmode) == -1) {
          throw new Error('Page mode must be one of UseNone, UseOutlines, UseThumbs, or FullScreen. "' + pmode + '" is not recognized.');
        }

        pageMode = pmode;
      };

      var getPageMode = API.__private__.getPageMode = function () {
        return pageMode;
      };

      var layoutMode; // default: 'continuous';

      var setLayoutMode = API.__private__.setLayoutMode = function (layout) {
        var validLayoutModes = [undefined, null, 'continuous', 'single', 'twoleft', 'tworight', 'two'];

        if (validLayoutModes.indexOf(layout) == -1) {
          throw new Error('Layout mode must be one of continuous, single, twoleft, tworight. "' + layout + '" is not recognized.');
        }

        layoutMode = layout;
      };

      var getLayoutMode = API.__private__.getLayoutMode = function () {
        return layoutMode;
      };
      /**
       * Set the display mode options of the page like zoom and layout.
       *
       * @name setDisplayMode
       * @memberOf jsPDF
       * @function 
       * @instance
       * @param {integer|String} zoom   You can pass an integer or percentage as
       * a string. 2 will scale the document up 2x, '200%' will scale up by the
       * same amount. You can also set it to 'fullwidth', 'fullheight',
       * 'fullpage', or 'original'.
       *
       * Only certain PDF readers support this, such as Adobe Acrobat.
       *
       * @param {string} layout Layout mode can be: 'continuous' - this is the
       * default continuous scroll. 'single' - the single page mode only shows one
       * page at a time. 'twoleft' - two column left mode, first page starts on
       * the left, and 'tworight' - pages are laid out in two columns, with the
       * first page on the right. This would be used for books.
       * @param {string} pmode 'UseOutlines' - it shows the
       * outline of the document on the left. 'UseThumbs' - shows thumbnails along
       * the left. 'FullScreen' - prompts the user to enter fullscreen mode.
       *
       * @returns {jsPDF}
       */


      var setDisplayMode = API.__private__.setDisplayMode = API.setDisplayMode = function (zoom, layout, pmode) {
        setZoomMode(zoom);
        setLayoutMode(layout);
        setPageMode(pmode);
        return this;
      };

      var documentProperties = {
        'title': '',
        'subject': '',
        'author': '',
        'keywords': '',
        'creator': ''
      };

      var getDocumentProperty = API.__private__.getDocumentProperty = function (key) {
        if (Object.keys(documentProperties).indexOf(key) === -1) {
          throw new Error('Invalid argument passed to jsPDF.getDocumentProperty');
        }

        return documentProperties[key];
      };

      var getDocumentProperties = API.__private__.getDocumentProperties = function (properties) {
        return documentProperties;
      };
      /**
       * Adds a properties to the PDF document.
       *
       * @param {Object} A property_name-to-property_value object structure.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setDocumentProperties
       */


      var setDocumentProperties = API.__private__.setDocumentProperties = API.setProperties = API.setDocumentProperties = function (properties) {
        // copying only those properties we can render.
        for (var property in documentProperties) {
          if (documentProperties.hasOwnProperty(property) && properties[property]) {
            documentProperties[property] = properties[property];
          }
        }

        return this;
      };

      var setDocumentProperty = API.__private__.setDocumentProperty = function (key, value) {
        if (Object.keys(documentProperties).indexOf(key) === -1) {
          throw new Error('Invalid arguments passed to jsPDF.setDocumentProperty');
        }

        return documentProperties[key] = value;
      };

      var objectNumber = 0; // 'n' Current object number

      var offsets = []; // List of offsets. Activated and reset by buildDocument(). Pupulated by various calls buildDocument makes.

      var fonts = {}; // collection of font objects, where key is fontKey - a dynamically created label for a given font.

      var fontmap = {}; // mapping structure fontName > fontStyle > font key - performance layer. See addFont()

      var activeFontKey; // will be string representing the KEY of the font as combination of fontName + fontStyle

      var k; // Scale factor

      var page = 0;
      var pagesContext = [];
      var additionalObjects = [];
      var events = new PubSub(API);
      var hotfixes = options.hotfixes || [];

      var newObject = API.__private__.newObject = function () {
        var oid = newObjectDeferred();
        newObjectDeferredBegin(oid, true);
        return oid;
      }; // Does not output the object.  The caller must call newObjectDeferredBegin(oid) before outputing any data


      var newObjectDeferred = API.__private__.newObjectDeferred = function () {
        objectNumber++;

        offsets[objectNumber] = function () {
          return content_length;
        };

        return objectNumber;
      };

      var newObjectDeferredBegin = function newObjectDeferredBegin(oid, doOutput) {
        doOutput = typeof doOutput === 'boolean' ? doOutput : false;
        offsets[oid] = content_length;

        if (doOutput) {
          out(oid + ' 0 obj');
        }

        return oid;
      }; // Does not output the object until after the pages have been output.
      // Returns an object containing the objectId and content.
      // All pages have been added so the object ID can be estimated to start right after.
      // This does not modify the current objectNumber;  It must be updated after the newObjects are output.


      var newAdditionalObject = API.__private__.newAdditionalObject = function () {
        var objId = newObjectDeferred();
        var obj = {
          objId: objId,
          content: ''
        };
        additionalObjects.push(obj);
        return obj;
      };

      var rootDictionaryObjId = newObjectDeferred();
      var resourceDictionaryObjId = newObjectDeferred(); /////////////////////
      // Private functions
      /////////////////////

      var decodeColorString = API.__private__.decodeColorString = function (color) {
        var colorEncoded = color.split(' ');

        if (colorEncoded.length === 2 && (colorEncoded[1] === 'g' || colorEncoded[1] === 'G')) {
          // convert grayscale value to rgb so that it can be converted to hex for consistency
          var floatVal = parseFloat(colorEncoded[0]);
          colorEncoded = [floatVal, floatVal, floatVal, 'r'];
        }

        var colorAsRGB = '#';

        for (var i = 0; i < 3; i++) {
          colorAsRGB += ('0' + Math.floor(parseFloat(colorEncoded[i]) * 255).toString(16)).slice(-2);
        }

        return colorAsRGB;
      };

      var encodeColorString = API.__private__.encodeColorString = function (options) {
        var color;

        if (typeof options === "string") {
          options = {
            ch1: options
          };
        }

        var ch1 = options.ch1;
        var ch2 = options.ch2;
        var ch3 = options.ch3;
        var ch4 = options.ch4;
        var precision = options.precision;
        var letterArray = options.pdfColorType === "draw" ? ['G', 'RG', 'K'] : ['g', 'rg', 'k'];

        if (typeof ch1 === "string" && ch1.charAt(0) !== '#') {
          var rgbColor = new RGBColor(ch1);

          if (rgbColor.ok) {
            ch1 = rgbColor.toHex();
          } else if (!/^\d*\.?\d*$/.test(ch1)) {
            throw new Error('Invalid color "' + ch1 + '" passed to jsPDF.encodeColorString.');
          }
        } //convert short rgb to long form


        if (typeof ch1 === "string" && /^#[0-9A-Fa-f]{3}$/.test(ch1)) {
          ch1 = '#' + ch1[1] + ch1[1] + ch1[2] + ch1[2] + ch1[3] + ch1[3];
        }

        if (typeof ch1 === "string" && /^#[0-9A-Fa-f]{6}$/.test(ch1)) {
          var hex = parseInt(ch1.substr(1), 16);
          ch1 = hex >> 16 & 255;
          ch2 = hex >> 8 & 255;
          ch3 = hex & 255;
        }

        if (typeof ch2 === "undefined" || typeof ch4 === "undefined" && ch1 === ch2 && ch2 === ch3) {
          // Gray color space.
          if (typeof ch1 === "string") {
            color = ch1 + " " + letterArray[0];
          } else {
            switch (options.precision) {
              case 2:
                color = f2(ch1 / 255) + " " + letterArray[0];
                break;

              case 3:
              default:
                color = f3(ch1 / 255) + " " + letterArray[0];
            }
          }
        } else if (typeof ch4 === "undefined" || _typeof(ch4) === "object") {
          // assume RGBA
          if (ch4 && !isNaN(ch4.a)) {
            //TODO Implement transparency.
            //WORKAROUND use white for now, if transparent, otherwise handle as rgb
            if (ch4.a === 0) {
              color = ['1.000', '1.000', '1.000', letterArray[1]].join(" ");
              return color;
            }
          } // assume RGB


          if (typeof ch1 === "string") {
            color = [ch1, ch2, ch3, letterArray[1]].join(" ");
          } else {
            switch (options.precision) {
              case 2:
                color = [f2(ch1 / 255), f2(ch2 / 255), f2(ch3 / 255), letterArray[1]].join(" ");
                break;

              default:
              case 3:
                color = [f3(ch1 / 255), f3(ch2 / 255), f3(ch3 / 255), letterArray[1]].join(" ");
            }
          }
        } else {
          // assume CMYK
          if (typeof ch1 === 'string') {
            color = [ch1, ch2, ch3, ch4, letterArray[2]].join(" ");
          } else {
            switch (options.precision) {
              case 2:
                color = [f2(ch1 / 255), f2(ch2 / 255), f2(ch3 / 255), f2(ch4 / 255), letterArray[2]].join(" ");
                break;

              case 3:
              default:
                color = [f3(ch1 / 255), f3(ch2 / 255), f3(ch3 / 255), f3(ch4 / 255), letterArray[2]].join(" ");
            }
          }
        }

        return color;
      };

      var getFilters = API.__private__.getFilters = function () {
        return filters;
      };

      var putStream = API.__private__.putStream = function (options) {
        options = options || {};
        var data = options.data || '';
        var filters = options.filters || getFilters();
        var alreadyAppliedFilters = options.alreadyAppliedFilters || [];
        var addLength1 = options.addLength1 || false;
        var valueOfLength1 = data.length;
        var processedData = {};

        if (filters === true) {
          filters = ['FlateEncode'];
        }

        var keyValues = options.additionalKeyValues || [];

        if (typeof jsPDF.API.processDataByFilters !== 'undefined') {
          processedData = jsPDF.API.processDataByFilters(data, filters);
        } else {
          processedData = {
            data: data,
            reverseChain: []
          };
        }

        var filterAsString = processedData.reverseChain + (Array.isArray(alreadyAppliedFilters) ? alreadyAppliedFilters.join(' ') : alreadyAppliedFilters.toString());

        if (processedData.data.length !== 0) {
          keyValues.push({
            key: 'Length',
            value: processedData.data.length
          });

          if (addLength1 === true) {
            keyValues.push({
              key: 'Length1',
              value: valueOfLength1
            });
          }
        }

        if (filterAsString.length != 0) {
          //if (filters.length === 0 && alreadyAppliedFilters.length === 1 && typeof alreadyAppliedFilters !== "undefined") {
          if (filterAsString.split('/').length - 1 === 1) {
            keyValues.push({
              key: 'Filter',
              value: filterAsString
            });
          } else {
            keyValues.push({
              key: 'Filter',
              value: '[' + filterAsString + ']'
            });
          }
        }

        out('<<');

        for (var i = 0; i < keyValues.length; i++) {
          out('/' + keyValues[i].key + ' ' + keyValues[i].value);
        }

        out('>>');

        if (processedData.data.length !== 0) {
          out('stream');
          out(processedData.data);
          out('endstream');
        }
      };

      var putPage = API.__private__.putPage = function (page) {
        var mediaBox = page.mediaBox;
        var pageNumber = page.number;
        var data = page.data;
        var pageObjectNumber = page.objId;
        var pageContentsObjId = page.contentsObjId;
        newObjectDeferredBegin(pageObjectNumber, true);
        var wPt = pagesContext[currentPage].mediaBox.topRightX - pagesContext[currentPage].mediaBox.bottomLeftX;
        var hPt = pagesContext[currentPage].mediaBox.topRightY - pagesContext[currentPage].mediaBox.bottomLeftY;
        out('<</Type /Page');
        out('/Parent ' + page.rootDictionaryObjId + ' 0 R');
        out('/Resources ' + page.resourceDictionaryObjId + ' 0 R');
        out('/MediaBox [' + parseFloat(f2(page.mediaBox.bottomLeftX)) + ' ' + parseFloat(f2(page.mediaBox.bottomLeftY)) + ' ' + f2(page.mediaBox.topRightX) + ' ' + f2(page.mediaBox.topRightY) + ']');

        if (page.cropBox !== null) {
          out('/CropBox [' + f2(page.cropBox.bottomLeftX) + ' ' + f2(page.cropBox.bottomLeftY) + ' ' + f2(page.cropBox.topRightX) + ' ' + f2(page.cropBox.topRightY) + ']');
        }

        if (page.bleedBox !== null) {
          out('/BleedBox [' + f2(page.bleedBox.bottomLeftX) + ' ' + f2(page.bleedBox.bottomLeftY) + ' ' + f2(page.bleedBox.topRightX) + ' ' + f2(page.bleedBox.topRightY) + ']');
        }

        if (page.trimBox !== null) {
          out('/TrimBox [' + f2(page.trimBox.bottomLeftX) + ' ' + f2(page.trimBox.bottomLeftY) + ' ' + f2(page.trimBox.topRightX) + ' ' + f2(page.trimBox.topRightY) + ']');
        }

        if (page.artBox !== null) {
          out('/ArtBox [' + f2(page.artBox.bottomLeftX) + ' ' + f2(page.artBox.bottomLeftY) + ' ' + f2(page.artBox.topRightX) + ' ' + f2(page.artBox.topRightY) + ']');
        }

        if (typeof page.userUnit === "number" && page.userUnit !== 1.0) {
          out('/UserUnit ' + page.userUnit);
        }

        events.publish('putPage', {
          objId: pageObjectNumber,
          pageContext: pagesContext[pageNumber],
          pageNumber: pageNumber,
          page: data
        });
        out('/Contents ' + pageContentsObjId + ' 0 R');
        out('>>');
        out('endobj'); // Page content

        var pageContent = data.join('\n');
        newObjectDeferredBegin(pageContentsObjId, true);
        putStream({
          data: pageContent,
          filters: getFilters()
        });
        out('endobj');
        return pageObjectNumber;
      };

      var putPages = API.__private__.putPages = function () {
        var n,
            i,
            pageObjectNumbers = [];

        for (n = 1; n <= page; n++) {
          pagesContext[n].objId = newObjectDeferred();
          pagesContext[n].contentsObjId = newObjectDeferred();
        }

        for (n = 1; n <= page; n++) {
          pageObjectNumbers.push(putPage({
            number: n,
            data: pages[n],
            objId: pagesContext[n].objId,
            contentsObjId: pagesContext[n].contentsObjId,
            mediaBox: pagesContext[n].mediaBox,
            cropBox: pagesContext[n].cropBox,
            bleedBox: pagesContext[n].bleedBox,
            trimBox: pagesContext[n].trimBox,
            artBox: pagesContext[n].artBox,
            userUnit: pagesContext[n].userUnit,
            rootDictionaryObjId: rootDictionaryObjId,
            resourceDictionaryObjId: resourceDictionaryObjId
          }));
        }

        newObjectDeferredBegin(rootDictionaryObjId, true);
        out('<</Type /Pages');
        var kids = '/Kids [';

        for (i = 0; i < page; i++) {
          kids += pageObjectNumbers[i] + ' 0 R ';
        }

        out(kids + ']');
        out('/Count ' + page);
        out('>>');
        out('endobj');
        events.publish('postPutPages');
      };

      var putFont = function putFont(font) {
        events.publish('putFont', {
          font: font,
          out: out,
          newObject: newObject,
          putStream: putStream
        });

        if (font.isAlreadyPutted !== true) {
          font.objectNumber = newObject();
          out('<<');
          out('/Type /Font');
          out('/BaseFont /' + font.postScriptName);
          out('/Subtype /Type1');

          if (typeof font.encoding === 'string') {
            out('/Encoding /' + font.encoding);
          }

          out('/FirstChar 32');
          out('/LastChar 255');
          out('>>');
          out('endobj');
        }
      };

      var putFonts = function putFonts() {
        for (var fontKey in fonts) {
          if (fonts.hasOwnProperty(fontKey)) {
            if (putOnlyUsedFonts === false || putOnlyUsedFonts === true && usedFonts.hasOwnProperty(fontKey)) {
              putFont(fonts[fontKey]);
            }
          }
        }
      };

      var putResourceDictionary = function putResourceDictionary() {
        out('/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]');
        out('/Font <<'); // Do this for each font, the '1' bit is the index of the font

        for (var fontKey in fonts) {
          if (fonts.hasOwnProperty(fontKey)) {
            if (putOnlyUsedFonts === false || putOnlyUsedFonts === true && usedFonts.hasOwnProperty(fontKey)) {
              out('/' + fontKey + ' ' + fonts[fontKey].objectNumber + ' 0 R');
            }
          }
        }

        out('>>');
        out('/XObject <<');
        events.publish('putXobjectDict');
        out('>>');
      };

      var putResources = function putResources() {
        putFonts();
        events.publish('putResources');
        newObjectDeferredBegin(resourceDictionaryObjId, true);
        out('<<');
        putResourceDictionary();
        out('>>');
        out('endobj');
        events.publish('postPutResources');
      };

      var putAdditionalObjects = function putAdditionalObjects() {
        events.publish('putAdditionalObjects');

        for (var i = 0; i < additionalObjects.length; i++) {
          var obj = additionalObjects[i];
          newObjectDeferredBegin(obj.objId, true);
          out(obj.content);
          out('endobj');
        }

        events.publish('postPutAdditionalObjects');
      };

      var addToFontDictionary = function addToFontDictionary(fontKey, fontName, fontStyle) {
        // this is mapping structure for quick font key lookup.
        // returns the KEY of the font (ex: "F1") for a given
        // pair of font name and type (ex: "Arial". "Italic")
        if (!fontmap.hasOwnProperty(fontName)) {
          fontmap[fontName] = {};
        }

        fontmap[fontName][fontStyle] = fontKey;
      };

      var addFont = function addFont(postScriptName, fontName, fontStyle, encoding, isStandardFont) {
        isStandardFont = isStandardFont || false;
        var fontKey = 'F' + (Object.keys(fonts).length + 1).toString(10),
            // This is FontObject
        font = {
          'id': fontKey,
          'postScriptName': postScriptName,
          'fontName': fontName,
          'fontStyle': fontStyle,
          'encoding': encoding,
          'isStandardFont': isStandardFont,
          'metadata': {}
        };
        var instance = this;
        events.publish('addFont', {
          font: font,
          instance: instance
        });

        if (fontKey !== undefined) {
          fonts[fontKey] = font;
          addToFontDictionary(fontKey, fontName, fontStyle);
        }

        return fontKey;
      };

      var addFonts = function addFonts(arrayOfFonts) {
        for (var i = 0, l = standardFonts.length; i < l; i++) {
          var fontKey = addFont(arrayOfFonts[i][0], arrayOfFonts[i][1], arrayOfFonts[i][2], standardFonts[i][3], true); // adding aliases for standard fonts, this time matching the capitalization

          var parts = arrayOfFonts[i][0].split('-');
          addToFontDictionary(fontKey, parts[0], parts[1] || '');
        }

        events.publish('addFonts', {
          fonts: fonts,
          dictionary: fontmap
        });
      };

      var SAFE = function __safeCall(fn) {
        fn.foo = function __safeCallWrapper() {
          try {
            return fn.apply(this, arguments);
          } catch (e) {
            var stack = e.stack || '';
            if (~stack.indexOf(' at ')) stack = stack.split(" at ")[1];
            var m = "Error in function " + stack.split("\n")[0].split('<')[0] + ": " + e.message;

            if (global.console) {
              global.console.error(m, e);
              if (global.alert) alert(m);
            } else {
              throw new Error(m);
            }
          }
        };

        fn.foo.bar = fn;
        return fn.foo;
      };

      var to8bitStream = function to8bitStream(text, flags) {
        /**
         * PDF 1.3 spec:
         * "For text strings encoded in Unicode, the first two bytes must be 254 followed by
         * 255, representing the Unicode byte order marker, U+FEFF. (This sequence conflicts
         * with the PDFDocEncoding character sequence thorn ydieresis, which is unlikely
         * to be a meaningful beginning of a word or phrase.) The remainder of the
         * string consists of Unicode character codes, according to the UTF-16 encoding
         * specified in the Unicode standard, version 2.0. Commonly used Unicode values
         * are represented as 2 bytes per character, with the high-order byte appearing first
         * in the string."
         *
         * In other words, if there are chars in a string with char code above 255, we
         * recode the string to UCS2 BE - string doubles in length and BOM is prepended.
         *
         * HOWEVER!
         * Actual *content* (body) text (as opposed to strings used in document properties etc)
         * does NOT expect BOM. There, it is treated as a literal GID (Glyph ID)
         *
         * Because of Adobe's focus on "you subset your fonts!" you are not supposed to have
         * a font that maps directly Unicode (UCS2 / UTF16BE) code to font GID, but you could
         * fudge it with "Identity-H" encoding and custom CIDtoGID map that mimics Unicode
         * code page. There, however, all characters in the stream are treated as GIDs,
         * including BOM, which is the reason we need to skip BOM in content text (i.e. that
         * that is tied to a font).
         *
         * To signal this "special" PDFEscape / to8bitStream handling mode,
         * API.text() function sets (unless you overwrite it with manual values
         * given to API.text(.., flags) )
         * flags.autoencode = true
         * flags.noBOM = true
         *
         * ===================================================================================
         * `flags` properties relied upon:
         *   .sourceEncoding = string with encoding label.
         *                     "Unicode" by default. = encoding of the incoming text.
         *                     pass some non-existing encoding name
         *                     (ex: 'Do not touch my strings! I know what I am doing.')
         *                     to make encoding code skip the encoding step.
         *   .outputEncoding = Either valid PDF encoding name
         *                     (must be supported by jsPDF font metrics, otherwise no encoding)
         *                     or a JS object, where key = sourceCharCode, value = outputCharCode
         *                     missing keys will be treated as: sourceCharCode === outputCharCode
         *   .noBOM
         *       See comment higher above for explanation for why this is important
         *   .autoencode
         *       See comment higher above for explanation for why this is important
         */
        var i, l, sourceEncoding, encodingBlock, outputEncoding, newtext, isUnicode, ch, bch;
        flags = flags || {};
        sourceEncoding = flags.sourceEncoding || 'Unicode';
        outputEncoding = flags.outputEncoding; // This 'encoding' section relies on font metrics format
        // attached to font objects by, among others,
        // "Willow Systems' standard_font_metrics plugin"
        // see jspdf.plugin.standard_font_metrics.js for format
        // of the font.metadata.encoding Object.
        // It should be something like
        //   .encoding = {'codePages':['WinANSI....'], 'WinANSI...':{code:code, ...}}
        //   .widths = {0:width, code:width, ..., 'fof':divisor}
        //   .kerning = {code:{previous_char_code:shift, ..., 'fof':-divisor},...}

        if ((flags.autoencode || outputEncoding) && fonts[activeFontKey].metadata && fonts[activeFontKey].metadata[sourceEncoding] && fonts[activeFontKey].metadata[sourceEncoding].encoding) {
          encodingBlock = fonts[activeFontKey].metadata[sourceEncoding].encoding; // each font has default encoding. Some have it clearly defined.

          if (!outputEncoding && fonts[activeFontKey].encoding) {
            outputEncoding = fonts[activeFontKey].encoding;
          } // Hmmm, the above did not work? Let's try again, in different place.


          if (!outputEncoding && encodingBlock.codePages) {
            outputEncoding = encodingBlock.codePages[0]; // let's say, first one is the default
          }

          if (typeof outputEncoding === 'string') {
            outputEncoding = encodingBlock[outputEncoding];
          } // we want output encoding to be a JS Object, where
          // key = sourceEncoding's character code and
          // value = outputEncoding's character code.


          if (outputEncoding) {
            isUnicode = false;
            newtext = [];

            for (i = 0, l = text.length; i < l; i++) {
              ch = outputEncoding[text.charCodeAt(i)];

              if (ch) {
                newtext.push(String.fromCharCode(ch));
              } else {
                newtext.push(text[i]);
              } // since we are looping over chars anyway, might as well
              // check for residual unicodeness


              if (newtext[i].charCodeAt(0) >> 8) {
                /* more than 255 */
                isUnicode = true;
              }
            }

            text = newtext.join('');
          }
        }

        i = text.length; // isUnicode may be set to false above. Hence the triple-equal to undefined

        while (isUnicode === undefined && i !== 0) {
          if (text.charCodeAt(i - 1) >> 8) {
            /* more than 255 */
            isUnicode = true;
          }

          i--;
        }

        if (!isUnicode) {
          return text;
        }

        newtext = flags.noBOM ? [] : [254, 255];

        for (i = 0, l = text.length; i < l; i++) {
          ch = text.charCodeAt(i);
          bch = ch >> 8; // divide by 256

          if (bch >> 8) {
            /* something left after dividing by 256 second time */
            throw new Error("Character at position " + i + " of string '" + text + "' exceeds 16bits. Cannot be encoded into UCS-2 BE");
          }

          newtext.push(bch);
          newtext.push(ch - (bch << 8));
        }

        return String.fromCharCode.apply(undefined, newtext);
      };

      var pdfEscape = API.__private__.pdfEscape = API.pdfEscape = function (text, flags) {
        /**
         * Replace '/', '(', and ')' with pdf-safe versions
         *
         * Doing to8bitStream does NOT make this PDF display unicode text. For that
         * we also need to reference a unicode font and embed it - royal pain in the rear.
         *
         * There is still a benefit to to8bitStream - PDF simply cannot handle 16bit chars,
         * which JavaScript Strings are happy to provide. So, while we still cannot display
         * 2-byte characters property, at least CONDITIONALLY converting (entire string containing)
         * 16bit chars to (USC-2-BE) 2-bytes per char + BOM streams we ensure that entire PDF
         * is still parseable.
         * This will allow immediate support for unicode in document properties strings.
         */
        return to8bitStream(text, flags).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      };

      var beginPage = API.__private__.beginPage = function (width, height) {
        var tmp; // Dimensions are stored as user units and converted to points on output

        var orientation = typeof height === 'string' && height.toLowerCase();

        if (typeof width === 'string') {
          if (tmp = getPageFormat(width.toLowerCase())) {
            width = tmp[0];
            height = tmp[1];
          }
        }

        if (Array.isArray(width)) {
          height = width[1];
          width = width[0];
        }

        if (isNaN(width) || isNaN(height)) {
          width = format[0];
          height = format[1];
        }

        if (orientation) {
          switch (orientation.substr(0, 1)) {
            case 'l':
              if (height > width) orientation = 's';
              break;

            case 'p':
              if (width > height) orientation = 's';
              break;
          }

          if (orientation === 's') {
            tmp = width;
            width = height;
            height = tmp;
          }
        }

        if (width > 14400 || height > 14400) {
          console.warn('A page in a PDF can not be wider or taller than 14400 userUnit. jsPDF limits the width/height to 14400');
          width = Math.min(14400, width);
          height = Math.min(14400, height);
        }

        format = [width, height];
        outToPages = true;
        pages[++page] = [];
        pagesContext[page] = {
          objId: 0,
          contentsObjId: 0,
          userUnit: Number(userUnit),
          artBox: null,
          bleedBox: null,
          cropBox: null,
          trimBox: null,
          mediaBox: {
            bottomLeftX: 0,
            bottomLeftY: 0,
            topRightX: Number(width),
            topRightY: Number(height)
          }
        };

        _setPage(page);
      };

      var _addPage = function _addPage() {
        beginPage.apply(this, arguments); // Set line width

        setLineWidth(lineWidth); // Set draw color

        out(strokeColor); // resurrecting non-default line caps, joins

        if (lineCapID !== 0) {
          out(lineCapID + ' J');
        }

        if (lineJoinID !== 0) {
          out(lineJoinID + ' j');
        }

        events.publish('addPage', {
          pageNumber: page
        });
      };

      var _deletePage = function _deletePage(n) {
        if (n > 0 && n <= page) {
          pages.splice(n, 1);
          page--;

          if (currentPage > page) {
            currentPage = page;
          }

          this.setPage(currentPage);
        }
      };

      var _setPage = function _setPage(n) {
        if (n > 0 && n <= page) {
          currentPage = n;
        }
      };

      var getNumberOfPages = API.__private__.getNumberOfPages = API.getNumberOfPages = function () {
        return pages.length - 1;
      };
      /**
       * Returns a document-specific font key - a label assigned to a
       * font name + font type combination at the time the font was added
       * to the font inventory.
       *
       * Font key is used as label for the desired font for a block of text
       * to be added to the PDF document stream.
       * @private
       * @function
       * @param fontName {string} can be undefined on "falthy" to indicate "use current"
       * @param fontStyle {string} can be undefined on "falthy" to indicate "use current"
       * @returns {string} Font key.
       * @ignore
       */


      var _getFont = function getFont(fontName, fontStyle, options) {
        var key = undefined,
            fontNameLowerCase;
        options = options || {};
        fontName = fontName !== undefined ? fontName : fonts[activeFontKey].fontName;
        fontStyle = fontStyle !== undefined ? fontStyle : fonts[activeFontKey].fontStyle;
        fontNameLowerCase = fontName.toLowerCase();

        if (fontmap[fontNameLowerCase] !== undefined && fontmap[fontNameLowerCase][fontStyle] !== undefined) {
          key = fontmap[fontNameLowerCase][fontStyle];
        } else if (fontmap[fontName] !== undefined && fontmap[fontName][fontStyle] !== undefined) {
          key = fontmap[fontName][fontStyle];
        } else {
          if (options.disableWarning === false) {
            console.warn("Unable to look up font label for font '" + fontName + "', '" + fontStyle + "'. Refer to getFontList() for available fonts.");
          }
        }

        if (!key && !options.noFallback) {
          key = fontmap['times'][fontStyle];

          if (key == null) {
            key = fontmap['times']['normal'];
          }
        }

        return key;
      };

      var putInfo = API.__private__.putInfo = function () {
        newObject();
        out('<<');
        out('/Producer (jsPDF ' + jsPDF.version + ')');

        for (var key in documentProperties) {
          if (documentProperties.hasOwnProperty(key) && documentProperties[key]) {
            out('/' + key.substr(0, 1).toUpperCase() + key.substr(1) + ' (' + pdfEscape(documentProperties[key]) + ')');
          }
        }

        out('/CreationDate (' + creationDate + ')');
        out('>>');
        out('endobj');
      };

      var putCatalog = API.__private__.putCatalog = function (options) {
        options = options || {};
        var tmpRootDictionaryObjId = options.rootDictionaryObjId || rootDictionaryObjId;
        newObject();
        out('<<');
        out('/Type /Catalog');
        out('/Pages ' + tmpRootDictionaryObjId + ' 0 R'); // PDF13ref Section 7.2.1

        if (!zoomMode) zoomMode = 'fullwidth';

        switch (zoomMode) {
          case 'fullwidth':
            out('/OpenAction [3 0 R /FitH null]');
            break;

          case 'fullheight':
            out('/OpenAction [3 0 R /FitV null]');
            break;

          case 'fullpage':
            out('/OpenAction [3 0 R /Fit]');
            break;

          case 'original':
            out('/OpenAction [3 0 R /XYZ null null 1]');
            break;

          default:
            var pcn = '' + zoomMode;
            if (pcn.substr(pcn.length - 1) === '%') zoomMode = parseInt(zoomMode) / 100;

            if (typeof zoomMode === 'number') {
              out('/OpenAction [3 0 R /XYZ null null ' + f2(zoomMode) + ']');
            }

        }

        if (!layoutMode) layoutMode = 'continuous';

        switch (layoutMode) {
          case 'continuous':
            out('/PageLayout /OneColumn');
            break;

          case 'single':
            out('/PageLayout /SinglePage');
            break;

          case 'two':
          case 'twoleft':
            out('/PageLayout /TwoColumnLeft');
            break;

          case 'tworight':
            out('/PageLayout /TwoColumnRight');
            break;
        }

        if (pageMode) {
          /**
           * A name object specifying how the document should be displayed when opened:
           * UseNone      : Neither document outline nor thumbnail images visible -- DEFAULT
           * UseOutlines  : Document outline visible
           * UseThumbs    : Thumbnail images visible
           * FullScreen   : Full-screen mode, with no menu bar, window controls, or any other window visible
           */
          out('/PageMode /' + pageMode);
        }

        events.publish('putCatalog');
        out('>>');
        out('endobj');
      };

      var putTrailer = API.__private__.putTrailer = function () {
        out('trailer');
        out('<<');
        out('/Size ' + (objectNumber + 1));
        out('/Root ' + objectNumber + ' 0 R');
        out('/Info ' + (objectNumber - 1) + ' 0 R');
        out("/ID [ <" + fileId + "> <" + fileId + "> ]");
        out('>>');
      };

      var putHeader = API.__private__.putHeader = function () {
        out('%PDF-' + pdfVersion);
        out("%\xBA\xDF\xAC\xE0");
      };

      var putXRef = API.__private__.putXRef = function () {
        var i = 1;
        var p = "0000000000";
        out('xref');
        out('0 ' + (objectNumber + 1));
        out('0000000000 65535 f ');

        for (i = 1; i <= objectNumber; i++) {
          var offset = offsets[i];

          if (typeof offset === 'function') {
            out((p + offsets[i]()).slice(-10) + ' 00000 n ');
          } else {
            if (typeof offsets[i] !== "undefined") {
              out((p + offsets[i]).slice(-10) + ' 00000 n ');
            } else {
              out('0000000000 00000 n ');
            }
          }
        }
      };

      var buildDocument = API.__private__.buildDocument = function () {
        outToPages = false; // switches out() to content
        //reset fields relevant for objectNumber generation and xref.

        objectNumber = 0;
        content_length = 0;
        content = [];
        offsets = [];
        additionalObjects = [];
        rootDictionaryObjId = newObjectDeferred();
        resourceDictionaryObjId = newObjectDeferred();
        events.publish('buildDocument');
        putHeader();
        putPages();
        putAdditionalObjects();
        putResources();
        putInfo();
        putCatalog();
        var offsetOfXRef = content_length;
        putXRef();
        putTrailer();
        out('startxref');
        out('' + offsetOfXRef);
        out('%%EOF');
        outToPages = true;
        return content.join('\n');
      };

      var getBlob = API.__private__.getBlob = function (data) {
        return new Blob([getArrayBuffer(data)], {
          type: "application/pdf"
        });
      };
      /**
       * Generates the PDF document.
       *
       * If `type` argument is undefined, output is raw body of resulting PDF returned as a string.
       *
       * @param {string} type A string identifying one of the possible output types. Possible values are 'arraybuffer', 'blob', 'bloburi'/'bloburl', 'datauristring'/'dataurlstring', 'datauri'/'dataurl', 'dataurlnewwindow'.
       * @param {Object} options An object providing some additional signalling to PDF generator. Possible options are 'filename'.
       *
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name output
       */


      var output = API.output = API.__private__.output = SAFE(function output(type, options) {
        options = options || {};
        var pdfDocument = buildDocument();

        if (typeof options === "string") {
          options = {
            filename: options
          };
        } else {
          options.filename = options.filename || 'generated.pdf';
        }

        switch (type) {
          case undefined:
            return pdfDocument;

          case 'save':
            API.save(options.filename);
            break;

          case 'arraybuffer':
            return getArrayBuffer(pdfDocument);

          case 'blob':
            return getBlob(pdfDocument);

          case 'bloburi':
          case 'bloburl':
            // Developer is responsible of calling revokeObjectURL
            if (typeof global.URL !== "undefined" && typeof global.URL.createObjectURL === "function") {
              return global.URL && global.URL.createObjectURL(getBlob(pdfDocument)) || void 0;
            } else {
              console.warn('bloburl is not supported by your system, because URL.createObjectURL is not supported by your browser.');
            }

            break;

          case 'datauristring':
          case 'dataurlstring':
            return 'data:application/pdf;filename=' + options.filename + ';base64,' + btoa(pdfDocument);

          case 'dataurlnewwindow':
            var htmlForNewWindow = '<html>' + '<style>html, body { padding: 0; margin: 0; } iframe { width: 100%; height: 100%; border: 0;}  </style>' + '<body>' + '<iframe src="' + this.output('datauristring') + '"></iframe>' + '</body></html>';
            var nW = global.open();

            if (nW !== null) {
              nW.document.write(htmlForNewWindow);
            }

            if (nW || typeof safari === "undefined") return nW;

          /* pass through */

          case 'datauri':
          case 'dataurl':
            return global.document.location.href = 'data:application/pdf;filename=' + options.filename + ';base64,' + btoa(pdfDocument);

          default:
            return null;
        }
      });
      /**
       * Used to see if a supplied hotfix was requested when the pdf instance was created.
       * @param {string} hotfixName - The name of the hotfix to check.
       * @returns {boolean}
       */

      var hasHotfix = function hasHotfix(hotfixName) {
        return Array.isArray(hotfixes) === true && hotfixes.indexOf(hotfixName) > -1;
      };

      switch (unit) {
        case 'pt':
          k = 1;
          break;

        case 'mm':
          k = 72 / 25.4;
          break;

        case 'cm':
          k = 72 / 2.54;
          break;

        case 'in':
          k = 72;
          break;

        case 'px':
          if (hasHotfix('px_scaling') == true) {
            k = 72 / 96;
          } else {
            k = 96 / 72;
          }

          break;

        case 'pc':
          k = 12;
          break;

        case 'em':
          k = 12;
          break;

        case 'ex':
          k = 6;
          break;

        default:
          throw new Error('Invalid unit: ' + unit);
      }

      setCreationDate();
      setFileId(); //---------------------------------------
      // Public API

      var getPageInfo = API.__private__.getPageInfo = function (pageNumberOneBased) {
        if (isNaN(pageNumberOneBased) || pageNumberOneBased % 1 !== 0) {
          throw new Error('Invalid argument passed to jsPDF.getPageInfo');
        }

        var objId = pagesContext[pageNumberOneBased].objId;
        return {
          objId: objId,
          pageNumber: pageNumberOneBased,
          pageContext: pagesContext[pageNumberOneBased]
        };
      };

      var getPageInfoByObjId = API.__private__.getPageInfoByObjId = function (objId) {

        for (var pageNumber in pagesContext) {
          if (pagesContext[pageNumber].objId === objId) {
            break;
          }
        }

        if (isNaN(objId) || objId % 1 !== 0) {
          throw new Error('Invalid argument passed to jsPDF.getPageInfoByObjId');
        }

        return getPageInfo(pageNumber);
      };

      var getCurrentPageInfo = API.__private__.getCurrentPageInfo = function () {
        return {
          objId: pagesContext[currentPage].objId,
          pageNumber: currentPage,
          pageContext: pagesContext[currentPage]
        };
      };
      /**
       * Adds (and transfers the focus to) new page to the PDF document.
       * @param format {String/Array} The format of the new page. Can be: <ul><li>a0 - a10</li><li>b0 - b10</li><li>c0 - c10</li><li>dl</li><li>letter</li><li>government-letter</li><li>legal</li><li>junior-legal</li><li>ledger</li><li>tabloid</li><li>credit-card</li></ul><br />
       * Default is "a4". If you want to use your own format just pass instead of one of the above predefined formats the size as an number-array, e.g. [595.28, 841.89]
       * @param orientation {string} Orientation of the new page. Possible values are "portrait" or "landscape" (or shortcuts "p" (Default), "l").
       * @function
       * @instance
       * @returns {jsPDF}
       *
       * @memberOf jsPDF
       * @name addPage
       */


      API.addPage = function () {
        _addPage.apply(this, arguments);

        return this;
      };
      /**
       * Adds (and transfers the focus to) new page to the PDF document.
       * @function
       * @instance
       * @returns {jsPDF}
       *
       * @memberOf jsPDF
       * @name setPage
       * @param {number} page Switch the active page to the page number specified.
       * @example
       * doc = jsPDF()
       * doc.addPage()
       * doc.addPage()
       * doc.text('I am on page 3', 10, 10)
       * doc.setPage(1)
       * doc.text('I am on page 1', 10, 10)
       */


      API.setPage = function () {
        _setPage.apply(this, arguments);

        return this;
      };
      /**
       * @name insertPage
       * @memberOf jsPDF
       * 
       * @function 
       * @instance
       * @param {Object} beforePage
       * @returns {jsPDF}
       */


      API.insertPage = function (beforePage) {
        this.addPage();
        this.movePage(currentPage, beforePage);
        return this;
      };
      /**
       * @name movePage
       * @memberOf jsPDF
       * @function
       * @instance
       * @param {Object} targetPage
       * @param {Object} beforePage
       * @returns {jsPDF}
       */


      API.movePage = function (targetPage, beforePage) {
        if (targetPage > beforePage) {
          var tmpPages = pages[targetPage];
          var tmpPagesContext = pagesContext[targetPage];

          for (var i = targetPage; i > beforePage; i--) {
            pages[i] = pages[i - 1];
            pagesContext[i] = pagesContext[i - 1];
          }

          pages[beforePage] = tmpPages;
          pagesContext[beforePage] = tmpPagesContext;
          this.setPage(beforePage);
        } else if (targetPage < beforePage) {
          var tmpPages = pages[targetPage];
          var tmpPagesContext = pagesContext[targetPage];

          for (var i = targetPage; i < beforePage; i++) {
            pages[i] = pages[i + 1];
            pagesContext[i] = pagesContext[i + 1];
          }

          pages[beforePage] = tmpPages;
          pagesContext[beforePage] = tmpPagesContext;
          this.setPage(beforePage);
        }

        return this;
      };
      /**
       * Deletes a page from the PDF.
       * @name deletePage
       * @memberOf jsPDF
       * @function
       * @instance
       * @returns {jsPDF}
       */


      API.deletePage = function () {
        _deletePage.apply(this, arguments);

        return this;
      };
      /**
       * Adds text to page. Supports adding multiline text when 'text' argument is an Array of Strings.
       *
       * @function
       * @instance
       * @param {String|Array} text String or array of strings to be added to the page. Each line is shifted one line down per font, spacing settings declared before this call.
       * @param {number} x Coordinate (in units declared at inception of PDF document) against left edge of the page.
       * @param {number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page.
       * @param {Object} [options] - Collection of settings signaling how the text must be encoded.
       * @param {string} [options.align=left] - The alignment of the text, possible values: left, center, right, justify.
       * @param {string} [options.baseline=alphabetic] - Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle.
       * @param {string} [options.angle=0] - Rotate the text counterclockwise. Expects the angle in degree.
       * @param {string} [options.charSpace=0] - The space between each letter.
       * @param {string} [options.lineHeightFactor=1.15] - The lineheight of each line.
       * @param {string} [options.flags] - Flags for to8bitStream.
       * @param {string} [options.flags.noBOM=true] - Don't add BOM to Unicode-text.
       * @param {string} [options.flags.autoencode=true] - Autoencode the Text.
       * @param {string} [options.maxWidth=0] - Split the text by given width, 0 = no split.
       * @param {string} [options.renderingMode=fill] - Set how the text should be rendered, possible values: fill, stroke, fillThenStroke, invisible, fillAndAddForClipping, strokeAndAddPathForClipping, fillThenStrokeAndAddToPathForClipping, addToPathForClipping.
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name text
       */


      var text = API.__private__.text = API.text = function (text, x, y, options) {
        /**
         * Inserts something like this into PDF
         *   BT
         *    /F1 16 Tf  % Font name + size
         *    16 TL % How many units down for next line in multiline text
         *    0 g % color
         *    28.35 813.54 Td % position
         *    (line one) Tj
         *    T* (line two) Tj
         *    T* (line three) Tj
         *   ET
         */
        //backwardsCompatibility
        var tmp; // Pre-August-2012 the order of arguments was function(x, y, text, flags)
        // in effort to make all calls have similar signature like
        //   function(data, coordinates... , miscellaneous)
        // this method had its args flipped.
        // code below allows backward compatibility with old arg order.

        if (typeof text === 'number' && typeof x === 'number' && (typeof y === 'string' || Array.isArray(y))) {
          tmp = y;
          y = x;
          x = text;
          text = tmp;
        }

        var flags = arguments[3];
        var angle = arguments[4];
        var align = arguments[5];

        if (_typeof(flags) !== "object" || flags === null) {
          if (typeof angle === 'string') {
            align = angle;
            angle = null;
          }

          if (typeof flags === 'string') {
            align = flags;
            flags = null;
          }

          if (typeof flags === 'number') {
            angle = flags;
            flags = null;
          }

          options = {
            flags: flags,
            angle: angle,
            align: align
          };
        }

        flags = flags || {};
        flags.noBOM = flags.noBOM || true;
        flags.autoencode = flags.autoencode || true;

        if (isNaN(x) || isNaN(y) || typeof text === "undefined" || text === null) {
          throw new Error('Invalid arguments passed to jsPDF.text');
        }

        if (text.length === 0) {
          return scope;
        }

        var xtra = '';
        var isHex = false;
        var lineHeight = typeof options.lineHeightFactor === 'number' ? options.lineHeightFactor : lineHeightFactor;
        var scope = options.scope || this;

        function ESC(s) {
          s = s.split("\t").join(Array(options.TabLen || 9).join(" "));
          return pdfEscape(s, flags);
        }

        function transformTextToSpecialArray(text) {
          //we don't want to destroy original text array, so cloning it
          var sa = text.concat();
          var da = [];
          var len = sa.length;
          var curDa; //we do array.join('text that must not be PDFescaped")
          //thus, pdfEscape each component separately

          while (len--) {
            curDa = sa.shift();

            if (typeof curDa === "string") {
              da.push(curDa);
            } else {
              if (Array.isArray(text) && curDa.length === 1) {
                da.push(curDa[0]);
              } else {
                da.push([curDa[0], curDa[1], curDa[2]]);
              }
            }
          }

          return da;
        }

        function processTextByFunction(text, processingFunction) {
          var result;

          if (typeof text === 'string') {
            result = processingFunction(text)[0];
          } else if (Array.isArray(text)) {
            //we don't want to destroy original text array, so cloning it
            var sa = text.concat();
            var da = [];
            var len = sa.length;
            var curDa;
            var tmpResult; //we do array.join('text that must not be PDFescaped")
            //thus, pdfEscape each component separately

            while (len--) {
              curDa = sa.shift();

              if (typeof curDa === "string") {
                da.push(processingFunction(curDa)[0]);
              } else if (Array.isArray(curDa) && curDa[0] === "string") {
                tmpResult = processingFunction(curDa[0], curDa[1], curDa[2]);
                da.push([tmpResult[0], tmpResult[1], tmpResult[2]]);
              }
            }

            result = da;
          }

          return result;
        } //Check if text is of type String


        var textIsOfTypeString = false;
        var tmpTextIsOfTypeString = true;

        if (typeof text === 'string') {
          textIsOfTypeString = true;
        } else if (Array.isArray(text)) {
          //we don't want to destroy original text array, so cloning it
          var sa = text.concat();
          var da = [];
          var len = sa.length;
          var curDa; //we do array.join('text that must not be PDFescaped")
          //thus, pdfEscape each component separately

          while (len--) {
            curDa = sa.shift();

            if (typeof curDa !== "string" || Array.isArray(curDa) && typeof curDa[0] !== "string") {
              tmpTextIsOfTypeString = false;
            }
          }

          textIsOfTypeString = tmpTextIsOfTypeString;
        }

        if (textIsOfTypeString === false) {
          throw new Error('Type of text must be string or Array. "' + text + '" is not recognized.');
        } //Escaping 


        var activeFontEncoding = fonts[activeFontKey].encoding;

        if (activeFontEncoding === "WinAnsiEncoding" || activeFontEncoding === "StandardEncoding") {
          text = processTextByFunction(text, function (text, posX, posY) {
            return [ESC(text), posX, posY];
          });
        } //If there are any newlines in text, we assume
        //the user wanted to print multiple lines, so break the
        //text up into an array. If the text is already an array,
        //we assume the user knows what they are doing.
        //Convert text into an array anyway to simplify
        //later code.


        if (typeof text === 'string') {
          if (text.match(/[\r?\n]/)) {
            text = text.split(/\r\n|\r|\n/g);
          } else {
            text = [text];
          }
        } //baseline


        var height = activeFontSize / scope.internal.scaleFactor;
        var descent = height * (lineHeightFactor - 1);

        switch (options.baseline) {
          case 'bottom':
            y -= descent;
            break;

          case 'top':
            y += height - descent;
            break;

          case 'hanging':
            y += height - 2 * descent;
            break;

          case 'middle':
            y += height / 2 - descent;
            break;

          case 'ideographic':
          case 'alphabetic':
          default:
            // do nothing, everything is fine
            break;
        } //multiline


        var maxWidth = options.maxWidth || 0;

        if (maxWidth > 0) {
          if (typeof text === 'string') {
            text = scope.splitTextToSize(text, maxWidth);
          } else if (Object.prototype.toString.call(text) === '[object Array]') {
            text = scope.splitTextToSize(text.join(" "), maxWidth);
          }
        } //creating Payload-Object to make text byRef


        var payload = {
          text: text,
          x: x,
          y: y,
          options: options,
          mutex: {
            pdfEscape: pdfEscape,
            activeFontKey: activeFontKey,
            fonts: fonts,
            activeFontSize: activeFontSize
          }
        };
        events.publish('preProcessText', payload);
        text = payload.text;
        options = payload.options; //angle

        var angle = options.angle;
        var k = scope.internal.scaleFactor;
        var transformationMatrix = [];

        if (angle) {
          angle *= Math.PI / 180;
          var c = Math.cos(angle),
              s = Math.sin(angle);
          transformationMatrix = [f2(c), f2(s), f2(s * -1), f2(c)];
        } //charSpace


        var charSpace = options.charSpace;

        if (typeof charSpace !== 'undefined') {
          xtra += f3(charSpace * k) + " Tc\n";
        } //lang


        var lang = options.lang;
        var tmpRenderingMode = -1;
        var parmRenderingMode = typeof options.renderingMode !== "undefined" ? options.renderingMode : options.stroke;
        var pageContext = scope.internal.getCurrentPageInfo().pageContext;

        switch (parmRenderingMode) {
          case 0:
          case false:
          case 'fill':
            tmpRenderingMode = 0;
            break;

          case 1:
          case true:
          case 'stroke':
            tmpRenderingMode = 1;
            break;

          case 2:
          case 'fillThenStroke':
            tmpRenderingMode = 2;
            break;

          case 3:
          case 'invisible':
            tmpRenderingMode = 3;
            break;

          case 4:
          case 'fillAndAddForClipping':
            tmpRenderingMode = 4;
            break;

          case 5:
          case 'strokeAndAddPathForClipping':
            tmpRenderingMode = 5;
            break;

          case 6:
          case 'fillThenStrokeAndAddToPathForClipping':
            tmpRenderingMode = 6;
            break;

          case 7:
          case 'addToPathForClipping':
            tmpRenderingMode = 7;
            break;
        }

        var usedRenderingMode = typeof pageContext.usedRenderingMode !== 'undefined' ? pageContext.usedRenderingMode : -1; //if the coder wrote it explicitly to use a specific 
        //renderingMode, then use it

        if (tmpRenderingMode !== -1) {
          xtra += tmpRenderingMode + " Tr\n"; //otherwise check if we used the rendering Mode already
          //if so then set the rendering Mode...
        } else if (usedRenderingMode !== -1) {
          xtra += "0 Tr\n";
        }

        if (tmpRenderingMode !== -1) {
          pageContext.usedRenderingMode = tmpRenderingMode;
        } //align


        var align = options.align || 'left';
        var leading = activeFontSize * lineHeight;
        var pageWidth = scope.internal.pageSize.getWidth();
        var k = scope.internal.scaleFactor;
        var activeFont = fonts[activeFontKey];
        var charSpace = options.charSpace || activeCharSpace;
        var maxWidth = options.maxWidth || 0;
        var lineWidths;
        var flags = {};
        var wordSpacingPerLine = [];

        if (Object.prototype.toString.call(text) === '[object Array]') {
          var da = transformTextToSpecialArray(text);
          var newY;
          var maxLineLength;
          var lineWidths;

          if (align !== "left") {
            lineWidths = da.map(function (v) {
              return scope.getStringUnitWidth(v, {
                font: activeFont,
                charSpace: charSpace,
                fontSize: activeFontSize
              }) * activeFontSize / k;
            });
          }

          var maxLineLength = Math.max.apply(Math, lineWidths); //The first line uses the "main" Td setting,
          //and the subsequent lines are offset by the
          //previous line's x coordinate.

          var prevWidth = 0;
          var delta;
          var newX;

          if (align === "right") {
            x -= lineWidths[0];
            text = [];

            for (var i = 0, len = da.length; i < len; i++) {
              delta = maxLineLength - lineWidths[i];

              if (i === 0) {
                newX = getHorizontalCoordinate(x);
                newY = getVerticalCoordinate(y);
              } else {
                newX = (prevWidth - lineWidths[i]) * k;
                newY = -leading;
              }

              text.push([da[i], newX, newY]);
              prevWidth = lineWidths[i];
            }
          } else if (align === "center") {
            x -= lineWidths[0] / 2;
            text = [];

            for (var i = 0, len = da.length; i < len; i++) {
              delta = (maxLineLength - lineWidths[i]) / 2;

              if (i === 0) {
                newX = getHorizontalCoordinate(x);
                newY = getVerticalCoordinate(y);
              } else {
                newX = (prevWidth - lineWidths[i]) / 2 * k;
                newY = -leading;
              }

              text.push([da[i], newX, newY]);
              prevWidth = lineWidths[i];
            }
          } else if (align === "left") {
            text = [];

            for (var i = 0, len = da.length; i < len; i++) {
              newY = i === 0 ? getVerticalCoordinate(y) : -leading;
              newX = i === 0 ? getHorizontalCoordinate(x) : 0; //text.push([da[i], newX, newY]);

              text.push(da[i]);
            }
          } else if (align === "justify") {
            text = [];
            var maxWidth = maxWidth !== 0 ? maxWidth : pageWidth;

            for (var i = 0, len = da.length; i < len; i++) {
              newY = i === 0 ? getVerticalCoordinate(y) : -leading;
              newX = i === 0 ? getHorizontalCoordinate(x) : 0;

              if (i < len - 1) {
                wordSpacingPerLine.push(((maxWidth - lineWidths[i]) / (da[i].split(" ").length - 1) * k).toFixed(2));
              }

              text.push([da[i], newX, newY]);
            }
          } else {
            throw new Error('Unrecognized alignment option, use "left", "center", "right" or "justify".');
          }
        } //R2L


        var doReversing = typeof options.R2L === "boolean" ? options.R2L : R2L;

        if (doReversing === true) {
          text = processTextByFunction(text, function (text, posX, posY) {
            return [text.split("").reverse().join(""), posX, posY];
          });
        } //creating Payload-Object to make text byRef


        var payload = {
          text: text,
          x: x,
          y: y,
          options: options,
          mutex: {
            pdfEscape: pdfEscape,
            activeFontKey: activeFontKey,
            fonts: fonts,
            activeFontSize: activeFontSize
          }
        };
        events.publish('postProcessText', payload);
        text = payload.text;
        isHex = payload.mutex.isHex;
        var da = transformTextToSpecialArray(text);
        text = [];
        var variant = 0;
        var len = da.length;
        var posX;
        var posY;
        var content;
        var wordSpacing = '';

        for (var i = 0; i < len; i++) {
          wordSpacing = '';

          if (!Array.isArray(da[i])) {
            posX = getHorizontalCoordinate(x);
            posY = getVerticalCoordinate(y);
            content = (isHex ? "<" : "(") + da[i] + (isHex ? ">" : ")");
          } else {
            posX = parseFloat(da[i][1]);
            posY = parseFloat(da[i][2]);
            content = (isHex ? "<" : "(") + da[i][0] + (isHex ? ">" : ")");
            variant = 1;
          }

          if (wordSpacingPerLine !== undefined && wordSpacingPerLine[i] !== undefined) {
            wordSpacing = wordSpacingPerLine[i] + " Tw\n";
          }

          if (transformationMatrix.length !== 0 && i === 0) {
            text.push(wordSpacing + transformationMatrix.join(" ") + " " + posX.toFixed(2) + " " + posY.toFixed(2) + " Tm\n" + content);
          } else if (variant === 1 || variant === 0 && i === 0) {
            text.push(wordSpacing + posX.toFixed(2) + " " + posY.toFixed(2) + " Td\n" + content);
          } else {
            text.push(wordSpacing + content);
          }
        }

        if (variant === 0) {
          text = text.join(" Tj\nT* ");
        } else {
          text = text.join(" Tj\n");
        }

        text += " Tj\n";
        var result = 'BT\n/' + activeFontKey + ' ' + activeFontSize + ' Tf\n' + // font face, style, size
        (activeFontSize * lineHeight).toFixed(2) + ' TL\n' + // line spacing
        textColor + '\n';
        result += xtra;
        result += text;
        result += "ET";
        out(result);
        usedFonts[activeFontKey] = true;
        return scope;
      };
      /**
       * Letter spacing method to print text with gaps
       *
       * @function
       * @instance
       * @param {String|Array} text String to be added to the page.
       * @param {number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
       * @param {number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
       * @param {number} spacing Spacing (in units declared at inception)
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name lstext
       * @deprecated We'll be removing this function. It doesn't take character width into account.
       */


      var lstext = API.__private__.lstext = API.lstext = function (text, x, y, charSpace) {
        console.warn('jsPDF.lstext is deprecated');
        return this.text(text, x, y, {
          charSpace: charSpace
        });
      };
      /**
       * 
       * @name clip
       * @function
       * @instance
       * @param {string} rule 
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @description All .clip() after calling drawing ops with a style argument of null.
       */


      var clip = API.__private__.clip = API.clip = function (rule) {
        // Call .clip() after calling drawing ops with a style argument of null
        // W is the PDF clipping op
        if ('evenodd' === rule) {
          out('W*');
        } else {
          out('W');
        } // End the path object without filling or stroking it.
        // This operator is a path-painting no-op, used primarily for the side effect of changing the current clipping path
        // (see Section 4.4.3, “Clipping Path Operators”)


        out('n');
      };
      /**
       * This fixes the previous function clip(). Perhaps the 'stroke path' hack was due to the missing 'n' instruction?
       * We introduce the fixed version so as to not break API.
       * @param fillRule
       * @ignore
       */


      var clip_fixed = API.__private__.clip_fixed = API.clip_fixed = function (rule) {
        console.log("clip_fixed is deprecated");
        API.clip(rule);
      };

      var isValidStyle = API.__private__.isValidStyle = function (style) {
        var validStyleVariants = [undefined, null, 'S', 'F', 'DF', 'FD', 'f', 'f*', 'B', 'B*'];
        var result = false;

        if (validStyleVariants.indexOf(style) !== -1) {
          result = true;
        }

        return result;
      };

      var getStyle = API.__private__.getStyle = function (style) {
        // see path-painting operators in PDF spec
        var op = 'S'; // stroke

        if (style === 'F') {
          op = 'f'; // fill
        } else if (style === 'FD' || style === 'DF') {
          op = 'B'; // both
        } else if (style === 'f' || style === 'f*' || style === 'B' || style === 'B*') {
          /*
           Allow direct use of these PDF path-painting operators:
           - f    fill using nonzero winding number rule
           - f*    fill using even-odd rule
           - B    fill then stroke with fill using non-zero winding number rule
           - B*    fill then stroke with fill using even-odd rule
           */
          op = style;
        }

        return op;
      };
      /**
       * Draw a line on the current page.
       *
       * @name line
       * @function 
       * @instance
       * @param {number} x1
       * @param {number} y1
       * @param {number} x2
       * @param {number} y2
       * @returns {jsPDF}
       * @memberOf jsPDF
       */


      var line = API.__private__.line = API.line = function (x1, y1, x2, y2) {
        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
          throw new Error('Invalid arguments passed to jsPDF.line');
        }

        return this.lines([[x2 - x1, y2 - y1]], x1, y1);
      };
      /**
       * Adds series of curves (straight lines or cubic bezier curves) to canvas, starting at `x`, `y` coordinates.
       * All data points in `lines` are relative to last line origin.
       * `x`, `y` become x1,y1 for first line / curve in the set.
       * For lines you only need to specify [x2, y2] - (ending point) vector against x1, y1 starting point.
       * For bezier curves you need to specify [x2,y2,x3,y3,x4,y4] - vectors to control points 1, 2, ending point. All vectors are against the start of the curve - x1,y1.
       *
       * @example .lines([[2,2],[-2,2],[1,1,2,2,3,3],[2,1]], 212,110, [1,1], 'F', false) // line, line, bezier curve, line
       * @param {Array} lines Array of *vector* shifts as pairs (lines) or sextets (cubic bezier curves).
       * @param {number} x Coordinate (in units declared at inception of PDF document) against left edge of the page.
       * @param {number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page.
       * @param {number} scale (Defaults to [1.0,1.0]) x,y Scaling factor for all vectors. Elements can be any floating number Sub-one makes drawing smaller. Over-one grows the drawing. Negative flips the direction.
       * @param {string} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
       * @param {boolean} closed If true, the path is closed with a straight line from the end of the last curve to the starting point.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name lines
       */


      var lines = API.__private__.lines = API.lines = function (lines, x, y, scale, style, closed) {
        var scalex, scaley, i, l, leg, x2, y2, x3, y3, x4, y4, tmp; // Pre-August-2012 the order of arguments was function(x, y, lines, scale, style)
        // in effort to make all calls have similar signature like
        //   function(content, coordinateX, coordinateY , miscellaneous)
        // this method had its args flipped.
        // code below allows backward compatibility with old arg order.

        if (typeof lines === 'number') {
          tmp = y;
          y = x;
          x = lines;
          lines = tmp;
        }

        scale = scale || [1, 1];
        closed = closed || false;

        if (isNaN(x) || isNaN(y) || !Array.isArray(lines) || !Array.isArray(scale) || !isValidStyle(style) || typeof closed !== 'boolean') {
          throw new Error('Invalid arguments passed to jsPDF.lines');
        } // starting point


        out(f3(getHorizontalCoordinate(x)) + ' ' + f3(getVerticalCoordinate(y)) + ' m ');
        scalex = scale[0];
        scaley = scale[1];
        l = lines.length; //, x2, y2 // bezier only. In page default measurement "units", *after* scaling
        //, x3, y3 // bezier only. In page default measurement "units", *after* scaling
        // ending point for all, lines and bezier. . In page default measurement "units", *after* scaling

        x4 = x; // last / ending point = starting point for first item.

        y4 = y; // last / ending point = starting point for first item.

        for (i = 0; i < l; i++) {
          leg = lines[i];

          if (leg.length === 2) {
            // simple line
            x4 = leg[0] * scalex + x4; // here last x4 was prior ending point

            y4 = leg[1] * scaley + y4; // here last y4 was prior ending point

            out(f3(getHorizontalCoordinate(x4)) + ' ' + f3(getVerticalCoordinate(y4)) + ' l');
          } else {
            // bezier curve
            x2 = leg[0] * scalex + x4; // here last x4 is prior ending point

            y2 = leg[1] * scaley + y4; // here last y4 is prior ending point

            x3 = leg[2] * scalex + x4; // here last x4 is prior ending point

            y3 = leg[3] * scaley + y4; // here last y4 is prior ending point

            x4 = leg[4] * scalex + x4; // here last x4 was prior ending point

            y4 = leg[5] * scaley + y4; // here last y4 was prior ending point

            out(f3(getHorizontalCoordinate(x2)) + ' ' + f3(getVerticalCoordinate(y2)) + ' ' + f3(getHorizontalCoordinate(x3)) + ' ' + f3(getVerticalCoordinate(y3)) + ' ' + f3(getHorizontalCoordinate(x4)) + ' ' + f3(getVerticalCoordinate(y4)) + ' c');
          }
        }

        if (closed) {
          out(' h');
        } // stroking / filling / both the path


        if (style !== null) {
          out(getStyle(style));
        }

        return this;
      };
      /**
       * Adds a rectangle to PDF.
       *
       * @param {number} x Coordinate (in units declared at inception of PDF document) against left edge of the page.
       * @param {number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page.
       * @param {number} w Width (in units declared at inception of PDF document).
       * @param {number} h Height (in units declared at inception of PDF document).
       * @param {string} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name rect
       */


      var rect = API.__private__.rect = API.rect = function (x, y, w, h, style) {
        if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h) || !isValidStyle(style)) {
          throw new Error('Invalid arguments passed to jsPDF.rect');
        }

        out([f2(getHorizontalCoordinate(x)), f2(getVerticalCoordinate(y)), f2(w * k), f2(-h * k), 're'].join(' '));

        if (style !== null) {
          out(getStyle(style));
        }

        return this;
      };
      /**
       * Adds a triangle to PDF.
       *
       * @param {number} x1 Coordinate (in units declared at inception of PDF document) against left edge of the page.
       * @param {number} y1 Coordinate (in units declared at inception of PDF document) against upper edge of the page.
       * @param {number} x2 Coordinate (in units declared at inception of PDF document) against left edge of the page.
       * @param {number} y2 Coordinate (in units declared at inception of PDF document) against upper edge of the page.
       * @param {number} x3 Coordinate (in units declared at inception of PDF document) against left edge of the page.
       * @param {number} y3 Coordinate (in units declared at inception of PDF document) against upper edge of the page.
       * @param {string} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name triangle
       */


      var triangle = API.__private__.triangle = API.triangle = function (x1, y1, x2, y2, x3, y3, style) {
        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2) || isNaN(x3) || isNaN(y3) || !isValidStyle(style)) {
          throw new Error('Invalid arguments passed to jsPDF.triangle');
        }

        this.lines([[x2 - x1, y2 - y1], // vector to point 2
        [x3 - x2, y3 - y2], // vector to point 3
        [x1 - x3, y1 - y3] // closing vector back to point 1
        ], x1, y1, // start of path
        [1, 1], style, true);
        return this;
      };
      /**
       * Adds a rectangle with rounded corners to PDF.
       *
       * @param {number} x Coordinate (in units declared at inception of PDF document) against left edge of the page.
       * @param {number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page.
       * @param {number} w Width (in units declared at inception of PDF document).
       * @param {number} h Height (in units declared at inception of PDF document).
       * @param {number} rx Radius along x axis (in units declared at inception of PDF document).
       * @param {number} ry Radius along y axis (in units declared at inception of PDF document).
       * @param {string} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name roundedRect
       */


      var roundedRect = API.__private__.roundedRect = API.roundedRect = function (x, y, w, h, rx, ry, style) {
        if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h) || isNaN(rx) || isNaN(ry) || !isValidStyle(style)) {
          throw new Error('Invalid arguments passed to jsPDF.roundedRect');
        }

        var MyArc = 4 / 3 * (Math.SQRT2 - 1);
        this.lines([[w - 2 * rx, 0], [rx * MyArc, 0, rx, ry - ry * MyArc, rx, ry], [0, h - 2 * ry], [0, ry * MyArc, -(rx * MyArc), ry, -rx, ry], [-w + 2 * rx, 0], [-(rx * MyArc), 0, -rx, -(ry * MyArc), -rx, -ry], [0, -h + 2 * ry], [0, -(ry * MyArc), rx * MyArc, -ry, rx, -ry]], x + rx, y, // start of path
        [1, 1], style);
        return this;
      };
      /**
       * Adds an ellipse to PDF.
       *
       * @param {number} x Coordinate (in units declared at inception of PDF document) against left edge of the page.
       * @param {number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page.
       * @param {number} rx Radius along x axis (in units declared at inception of PDF document).
       * @param {number} ry Radius along y axis (in units declared at inception of PDF document).
       * @param {string} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name ellipse
       */


      var ellise = API.__private__.ellipse = API.ellipse = function (x, y, rx, ry, style) {
        if (isNaN(x) || isNaN(y) || isNaN(rx) || isNaN(ry) || !isValidStyle(style)) {
          throw new Error('Invalid arguments passed to jsPDF.ellipse');
        }

        var lx = 4 / 3 * (Math.SQRT2 - 1) * rx,
            ly = 4 / 3 * (Math.SQRT2 - 1) * ry;
        out([f2(getHorizontalCoordinate(x + rx)), f2(getVerticalCoordinate(y)), 'm', f2(getHorizontalCoordinate(x + rx)), f2(getVerticalCoordinate(y - ly)), f2(getHorizontalCoordinate(x + lx)), f2(getVerticalCoordinate(y - ry)), f2(getHorizontalCoordinate(x)), f2(getVerticalCoordinate(y - ry)), 'c'].join(' '));
        out([f2(getHorizontalCoordinate(x - lx)), f2(getVerticalCoordinate(y - ry)), f2(getHorizontalCoordinate(x - rx)), f2(getVerticalCoordinate(y - ly)), f2(getHorizontalCoordinate(x - rx)), f2(getVerticalCoordinate(y)), 'c'].join(' '));
        out([f2(getHorizontalCoordinate(x - rx)), f2(getVerticalCoordinate(y + ly)), f2(getHorizontalCoordinate(x - lx)), f2(getVerticalCoordinate(y + ry)), f2(getHorizontalCoordinate(x)), f2(getVerticalCoordinate(y + ry)), 'c'].join(' '));
        out([f2(getHorizontalCoordinate(x + lx)), f2(getVerticalCoordinate(y + ry)), f2(getHorizontalCoordinate(x + rx)), f2(getVerticalCoordinate(y + ly)), f2(getHorizontalCoordinate(x + rx)), f2(getVerticalCoordinate(y)), 'c'].join(' '));

        if (style !== null) {
          out(getStyle(style));
        }

        return this;
      };
      /**
       * Adds an circle to PDF.
       *
       * @param {number} x Coordinate (in units declared at inception of PDF document) against left edge of the page.
       * @param {number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page.
       * @param {number} r Radius (in units declared at inception of PDF document).
       * @param {string} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name circle
       */


      var circle = API.__private__.circle = API.circle = function (x, y, r, style) {
        if (isNaN(x) || isNaN(y) || isNaN(r) || !isValidStyle(style)) {
          throw new Error('Invalid arguments passed to jsPDF.circle');
        }

        return this.ellipse(x, y, r, r, style);
      };
      /**
       * Sets text font face, variant for upcoming text elements.
       * See output of jsPDF.getFontList() for possible font names, styles.
       *
       * @param {string} fontName Font name or family. Example: "times".
       * @param {string} fontStyle Font style or variant. Example: "italic".
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setFont
       */


      API.setFont = function (fontName, fontStyle) {
        activeFontKey = _getFont(fontName, fontStyle, {
          disableWarning: false
        });
        return this;
      };
      /**
       * Switches font style or variant for upcoming text elements,
       * while keeping the font face or family same.
       * See output of jsPDF.getFontList() for possible font names, styles.
       *
       * @param {string} style Font style or variant. Example: "italic".
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setFontStyle
       */


      API.setFontStyle = API.setFontType = function (style) {
        activeFontKey = _getFont(undefined, style); // if font is not found, the above line blows up and we never go further

        return this;
      };
      /**
       * Returns an object - a tree of fontName to fontStyle relationships available to
       * active PDF document.
       *
       * @public
       * @function
       * @instance
       * @returns {Object} Like {'times':['normal', 'italic', ... ], 'arial':['normal', 'bold', ... ], ... }
       * @memberOf jsPDF
       * @name getFontList
       */


      var getFontList = API.__private__.getFontList = API.getFontList = function () {
        // TODO: iterate over fonts array or return copy of fontmap instead in case more are ever added.
        var list = {},
            fontName,
            fontStyle,
            tmp;

        for (fontName in fontmap) {
          if (fontmap.hasOwnProperty(fontName)) {
            list[fontName] = tmp = [];

            for (fontStyle in fontmap[fontName]) {
              if (fontmap[fontName].hasOwnProperty(fontStyle)) {
                tmp.push(fontStyle);
              }
            }
          }
        }

        return list;
      };
      /**
       * Add a custom font to the current instance.
       *
       * @property {string} postScriptName PDF specification full name for the font.
       * @property {string} id PDF-document-instance-specific label assinged to the font.
       * @property {string} fontStyle Style of the Font.
       * @property {Object} encoding Encoding_name-to-Font_metrics_object mapping.
       * @function
       * @instance
       * @memberOf jsPDF
       * @name addFont
       */


      API.addFont = function (postScriptName, fontName, fontStyle, encoding) {
        encoding = encoding || 'Identity-H';
        addFont.call(this, postScriptName, fontName, fontStyle, encoding);
      };

      var lineWidth = options.lineWidth || 0.200025; // 2mm

      /**
       * Sets line width for upcoming lines.
       *
       * @param {number} width Line width (in units declared at inception of PDF document).
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setLineWidth
       */

      var setLineWidth = API.__private__.setLineWidth = API.setLineWidth = function (width) {
        out((width * k).toFixed(2) + ' w');
        return this;
      };
      /**
       * Sets the dash pattern for upcoming lines.
       * 
       * To reset the settings simply call the method without any parameters.
       * @param {array} dashArray The pattern of the line, expects numbers. 
       * @param {number} dashPhase The phase at which the dash pattern starts.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setLineDash
       */


      var setLineDash = API.__private__.setLineDash = jsPDF.API.setLineDash = function (dashArray, dashPhase) {
        dashArray = dashArray || [];
        dashPhase = dashPhase || 0;

        if (isNaN(dashPhase) || !Array.isArray(dashArray)) {
          throw new Error('Invalid arguments passed to jsPDF.setLineDash');
        }

        dashArray = dashArray.map(function (x) {
          return (x * k).toFixed(3);
        }).join(' ');
        dashPhase = parseFloat((dashPhase * k).toFixed(3));
        out('[' + dashArray + '] ' + dashPhase + ' d');
        return this;
      };

      var lineHeightFactor;

      var getLineHeight = API.__private__.getLineHeight = API.getLineHeight = function () {
        return activeFontSize * lineHeightFactor;
      };

      var lineHeightFactor;

      var getLineHeight = API.__private__.getLineHeight = API.getLineHeight = function () {
        return activeFontSize * lineHeightFactor;
      };
      /**
       * Sets the LineHeightFactor of proportion.
       *
       * @param {number} value LineHeightFactor value. Default: 1.15.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setLineHeightFactor
       */


      var setLineHeightFactor = API.__private__.setLineHeightFactor = API.setLineHeightFactor = function (value) {
        value = value || 1.15;

        if (typeof value === "number") {
          lineHeightFactor = value;
        }

        return this;
      };
      /**
       * Gets the LineHeightFactor, default: 1.15.
       *
       * @function
       * @instance
       * @returns {number} lineHeightFactor
       * @memberOf jsPDF
       * @name getLineHeightFactor
       */


      var getLineHeightFactor = API.__private__.getLineHeightFactor = API.getLineHeightFactor = function () {
        return lineHeightFactor;
      };

      setLineHeightFactor(options.lineHeight);

      var getHorizontalCoordinate = API.__private__.getHorizontalCoordinate = function (value) {
        return value * k;
      };

      var getVerticalCoordinate = API.__private__.getVerticalCoordinate = function (value) {
        return pagesContext[currentPage].mediaBox.topRightY - pagesContext[currentPage].mediaBox.bottomLeftY - value * k;
      };

      var getHorizontalCoordinateString = API.__private__.getHorizontalCoordinateString = function (value) {
        return f2(value * k);
      };

      var getVerticalCoordinateString = API.__private__.getVerticalCoordinateString = function (value) {
        return f2(pagesContext[currentPage].mediaBox.topRightY - pagesContext[currentPage].mediaBox.bottomLeftY - value * k);
      };

      var strokeColor = options.strokeColor || '0 G';
      /**
       *  Gets the stroke color for upcoming elements.
       *
       * @function
       * @instance
       * @returns {string} colorAsHex
       * @memberOf jsPDF
       * @name getDrawColor
       */

      var getStrokeColor = API.__private__.getStrokeColor = API.getDrawColor = function () {
        return decodeColorString(strokeColor);
      };
      /**
       * Sets the stroke color for upcoming elements.
       *
       * Depending on the number of arguments given, Gray, RGB, or CMYK
       * color space is implied.
       *
       * When only ch1 is given, "Gray" color space is implied and it
       * must be a value in the range from 0.00 (solid black) to to 1.00 (white)
       * if values are communicated as String types, or in range from 0 (black)
       * to 255 (white) if communicated as Number type.
       * The RGB-like 0-255 range is provided for backward compatibility.
       *
       * When only ch1,ch2,ch3 are given, "RGB" color space is implied and each
       * value must be in the range from 0.00 (minimum intensity) to to 1.00
       * (max intensity) if values are communicated as String types, or
       * from 0 (min intensity) to to 255 (max intensity) if values are communicated
       * as Number types.
       * The RGB-like 0-255 range is provided for backward compatibility.
       *
       * When ch1,ch2,ch3,ch4 are given, "CMYK" color space is implied and each
       * value must be a in the range from 0.00 (0% concentration) to to
       * 1.00 (100% concentration)
       *
       * Because JavaScript treats fixed point numbers badly (rounds to
       * floating point nearest to binary representation) it is highly advised to
       * communicate the fractional numbers as String types, not JavaScript Number type.
       *
       * @param {Number|String} ch1 Color channel value or {string} ch1 color value in hexadecimal, example: '#FFFFFF'.
       * @param {Number|String} ch2 Color channel value.
       * @param {Number|String} ch3 Color channel value.
       * @param {Number|String} ch4 Color channel value.
       *
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setDrawColor
       */


      var setStrokeColor = API.__private__.setStrokeColor = API.setDrawColor = function (ch1, ch2, ch3, ch4) {
        var options = {
          "ch1": ch1,
          "ch2": ch2,
          "ch3": ch3,
          "ch4": ch4,
          "pdfColorType": "draw",
          "precision": 2
        };
        strokeColor = encodeColorString(options);
        out(strokeColor);
        return this;
      };

      var fillColor = options.fillColor || '0 g';
      /**
       * Gets the fill color for upcoming elements.
       *
       * @function
       * @instance
       * @returns {string} colorAsHex
       * @memberOf jsPDF
       * @name getFillColor
       */

      var getFillColor = API.__private__.getFillColor = API.getFillColor = function () {
        return decodeColorString(fillColor);
      };
      /**
       * Sets the fill color for upcoming elements.
       *
       * Depending on the number of arguments given, Gray, RGB, or CMYK
       * color space is implied.
       *
       * When only ch1 is given, "Gray" color space is implied and it
       * must be a value in the range from 0.00 (solid black) to to 1.00 (white)
       * if values are communicated as String types, or in range from 0 (black)
       * to 255 (white) if communicated as Number type.
       * The RGB-like 0-255 range is provided for backward compatibility.
       *
       * When only ch1,ch2,ch3 are given, "RGB" color space is implied and each
       * value must be in the range from 0.00 (minimum intensity) to to 1.00
       * (max intensity) if values are communicated as String types, or
       * from 0 (min intensity) to to 255 (max intensity) if values are communicated
       * as Number types.
       * The RGB-like 0-255 range is provided for backward compatibility.
       *
       * When ch1,ch2,ch3,ch4 are given, "CMYK" color space is implied and each
       * value must be a in the range from 0.00 (0% concentration) to to
       * 1.00 (100% concentration)
       *
       * Because JavaScript treats fixed point numbers badly (rounds to
       * floating point nearest to binary representation) it is highly advised to
       * communicate the fractional numbers as String types, not JavaScript Number type.
       *
       * @param {Number|String} ch1 Color channel value or {string} ch1 color value in hexadecimal, example: '#FFFFFF'.
       * @param {Number|String} ch2 Color channel value.
       * @param {Number|String} ch3 Color channel value.
       * @param {Number|String} ch4 Color channel value.
       *
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setFillColor
       */


      var setFillColor = API.__private__.setFillColor = API.setFillColor = function (ch1, ch2, ch3, ch4) {
        var options = {
          "ch1": ch1,
          "ch2": ch2,
          "ch3": ch3,
          "ch4": ch4,
          "pdfColorType": "fill",
          "precision": 2
        };
        fillColor = encodeColorString(options);
        out(fillColor);
        return this;
      };

      var textColor = options.textColor || '0 g';
      /**
       * Gets the text color for upcoming elements.
       *
       * @function
       * @instance
       * @returns {string} colorAsHex
       * @memberOf jsPDF
       * @name getTextColor
       */

      var getTextColor = API.__private__.getTextColor = API.getTextColor = function () {
        return decodeColorString(textColor);
      };
      /**
       * Sets the text color for upcoming elements.
       *
       * Depending on the number of arguments given, Gray, RGB, or CMYK
       * color space is implied.
       *
       * When only ch1 is given, "Gray" color space is implied and it
       * must be a value in the range from 0.00 (solid black) to to 1.00 (white)
       * if values are communicated as String types, or in range from 0 (black)
       * to 255 (white) if communicated as Number type.
       * The RGB-like 0-255 range is provided for backward compatibility.
       *
       * When only ch1,ch2,ch3 are given, "RGB" color space is implied and each
       * value must be in the range from 0.00 (minimum intensity) to to 1.00
       * (max intensity) if values are communicated as String types, or
       * from 0 (min intensity) to to 255 (max intensity) if values are communicated
       * as Number types.
       * The RGB-like 0-255 range is provided for backward compatibility.
       *
       * When ch1,ch2,ch3,ch4 are given, "CMYK" color space is implied and each
       * value must be a in the range from 0.00 (0% concentration) to to
       * 1.00 (100% concentration)
       *
       * Because JavaScript treats fixed point numbers badly (rounds to
       * floating point nearest to binary representation) it is highly advised to
       * communicate the fractional numbers as String types, not JavaScript Number type.
       *
       * @param {Number|String} ch1 Color channel value or {string} ch1 color value in hexadecimal, example: '#FFFFFF'.
       * @param {Number|String} ch2 Color channel value.
       * @param {Number|String} ch3 Color channel value.
       * @param {Number|String} ch4 Color channel value.
       *
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setTextColor
       */


      var setTextColor = API.__private__.setTextColor = API.setTextColor = function (ch1, ch2, ch3, ch4) {
        var options = {
          "ch1": ch1,
          "ch2": ch2,
          "ch3": ch3,
          "ch4": ch4,
          "pdfColorType": "text",
          "precision": 3
        };
        textColor = encodeColorString(options);
        return this;
      };

      var activeCharSpace = options.charSpace || 0;
      /**
       * Get global value of CharSpace.
       *
       * @function
       * @instance
       * @returns {number} charSpace
       * @memberOf jsPDF
       * @name getCharSpace
       */

      var getCharSpace = API.__private__.getCharSpace = API.getCharSpace = function () {
        return activeCharSpace;
      };
      /**
       * Set global value of CharSpace.
       *
       * @param {number} charSpace
       * @function
       * @instance
       * @returns {jsPDF} jsPDF-instance
       * @memberOf jsPDF
       * @name setCharSpace
       */


      var setCharSpace = API.__private__.setCharSpace = API.setCharSpace = function (charSpace) {
        if (isNaN(charSpace)) {
          throw new Error('Invalid argument passed to jsPDF.setCharSpace');
        }

        activeCharSpace = charSpace;
        return this;
      };

      var lineCapID = 0;
      /**
       * Is an Object providing a mapping from human-readable to
       * integer flag values designating the varieties of line cap
       * and join styles.
       *
       * @memberOf jsPDF
       * @name CapJoinStyles
       */

      API.CapJoinStyles = {
        0: 0,
        'butt': 0,
        'but': 0,
        'miter': 0,
        1: 1,
        'round': 1,
        'rounded': 1,
        'circle': 1,
        2: 2,
        'projecting': 2,
        'project': 2,
        'square': 2,
        'bevel': 2
      };
      /**
       * Sets the line cap styles.
       * See {jsPDF.CapJoinStyles} for variants.
       *
       * @param {String|Number} style A string or number identifying the type of line cap.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setLineCap
       */

      var setLineCap = API.__private__.setLineCap = API.setLineCap = function (style) {
        var id = API.CapJoinStyles[style];

        if (id === undefined) {
          throw new Error("Line cap style of '" + style + "' is not recognized. See or extend .CapJoinStyles property for valid styles");
        }

        lineCapID = id;
        out(id + ' J');
        return this;
      };

      var lineJoinID = 0;
      /**
       * Sets the line join styles.
       * See {jsPDF.CapJoinStyles} for variants.
       *
       * @param {String|Number} style A string or number identifying the type of line join.
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setLineJoin
       */

      var setLineJoin = API.__private__.setLineJoin = API.setLineJoin = function (style) {
        var id = API.CapJoinStyles[style];

        if (id === undefined) {
          throw new Error("Line join style of '" + style + "' is not recognized. See or extend .CapJoinStyles property for valid styles");
        }

        lineJoinID = id;
        out(id + ' j');
        return this;
      };

      var miterLimit;
      /**
       * Sets the miterLimit property, which effects the maximum miter length.
       *
       * @param {number} length The length of the miter
       * @function
       * @instance
       * @returns {jsPDF}
       * @memberOf jsPDF
       * @name setMiterLimit
       */

      var setMiterLimit = API.__private__.setMiterLimit = API.setMiterLimit = function (length) {
        length = length || 0;

        if (isNaN(length)) {
          throw new Error('Invalid argument passed to jsPDF.setMiterLimit');
        }

        miterLimit = parseFloat(f2(length * k));
        out(miterLimit + ' M');
        return this;
      };
      /**
       * Saves as PDF document. An alias of jsPDF.output('save', 'filename.pdf').
       * Uses FileSaver.js-method saveAs.
       *
       * @memberOf jsPDF
       * @name save
       * @function
       * @instance
       * @param  {string} filename The filename including extension.
       * @param  {Object} options An Object with additional options, possible options: 'returnPromise'.
       * @returns {jsPDF} jsPDF-instance
       */


      API.save = function (filename, options) {
        filename = filename || 'generated.pdf';
        options = options || {};
        options.returnPromise = options.returnPromise || false;

        if (options.returnPromise === false) {
          saveAs(getBlob(buildDocument()), filename);

          if (typeof saveAs.unload === 'function') {
            if (global.setTimeout) {
              setTimeout(saveAs.unload, 911);
            }
          }
        } else {
          return new Promise(function (resolve, reject) {
            try {
              var result = saveAs(getBlob(buildDocument()), filename);

              if (typeof saveAs.unload === 'function') {
                if (global.setTimeout) {
                  setTimeout(saveAs.unload, 911);
                }
              }

              resolve(result);
            } catch (e) {
              reject(e.message);
            }
          });
        }
      }; // applying plugins (more methods) ON TOP of built-in API.
      // this is intentional as we allow plugins to override
      // built-ins


      for (var plugin in jsPDF.API) {
        if (jsPDF.API.hasOwnProperty(plugin)) {
          if (plugin === 'events' && jsPDF.API.events.length) {
            (function (events, newEvents) {
              // jsPDF.API.events is a JS Array of Arrays
              // where each Array is a pair of event name, handler
              // Events were added by plugins to the jsPDF instantiator.
              // These are always added to the new instance and some ran
              // during instantiation.
              var eventname, handler_and_args, i;

              for (i = newEvents.length - 1; i !== -1; i--) {
                // subscribe takes 3 args: 'topic', function, runonce_flag
                // if undefined, runonce is false.
                // users can attach callback directly,
                // or they can attach an array with [callback, runonce_flag]
                // that's what the "apply" magic is for below.
                eventname = newEvents[i][0];
                handler_and_args = newEvents[i][1];
                events.subscribe.apply(events, [eventname].concat(typeof handler_and_args === 'function' ? [handler_and_args] : handler_and_args));
              }
            })(events, jsPDF.API.events);
          } else {
            API[plugin] = jsPDF.API[plugin];
          }
        }
      }
      /**
       * Object exposing internal API to plugins
       * @public
       * @ignore
       */


      API.internal = {
        'pdfEscape': pdfEscape,
        'getStyle': getStyle,
        'getFont': function getFont() {
          return fonts[_getFont.apply(API, arguments)];
        },
        'getFontSize': getFontSize,
        'getCharSpace': getCharSpace,
        'getTextColor': getTextColor,
        'getLineHeight': getLineHeight,
        'getLineHeightFactor': getLineHeightFactor,
        'write': write,
        'getHorizontalCoordinate': getHorizontalCoordinate,
        'getVerticalCoordinate': getVerticalCoordinate,
        'getCoordinateString': getHorizontalCoordinateString,
        'getVerticalCoordinateString': getVerticalCoordinateString,
        'collections': {},
        'newObject': newObject,
        'newAdditionalObject': newAdditionalObject,
        'newObjectDeferred': newObjectDeferred,
        'newObjectDeferredBegin': newObjectDeferredBegin,
        'getFilters': getFilters,
        'putStream': putStream,
        'events': events,
        // ratio that you use in multiplication of a given "size" number to arrive to 'point'
        // units of measurement.
        // scaleFactor is set at initialization of the document and calculated against the stated
        // default measurement units for the document.
        // If default is "mm", k is the number that will turn number in 'mm' into 'points' number.
        // through multiplication.
        'scaleFactor': k,
        'pageSize': {
          getWidth: function getWidth() {
            return (pagesContext[currentPage].mediaBox.topRightX - pagesContext[currentPage].mediaBox.bottomLeftX) / k;
          },
          setWidth: function setWidth(value) {
            pagesContext[currentPage].mediaBox.topRightX = value * k + pagesContext[currentPage].mediaBox.bottomLeftX;
          },
          getHeight: function getHeight() {
            return (pagesContext[currentPage].mediaBox.topRightY - pagesContext[currentPage].mediaBox.bottomLeftY) / k;
          },
          setHeight: function setHeight(value) {
            pagesContext[currentPage].mediaBox.topRightY = value * k + pagesContext[currentPage].mediaBox.bottomLeftY;
          }
        },
        'output': output,
        'getNumberOfPages': getNumberOfPages,
        'pages': pages,
        'out': out,
        'f2': f2,
        'f3': f3,
        'getPageInfo': getPageInfo,
        'getPageInfoByObjId': getPageInfoByObjId,
        'getCurrentPageInfo': getCurrentPageInfo,
        'getPDFVersion': getPdfVersion,
        'hasHotfix': hasHotfix //Expose the hasHotfix check so plugins can also check them.

      };
      Object.defineProperty(API.internal.pageSize, 'width', {
        get: function get() {
          return (pagesContext[currentPage].mediaBox.topRightX - pagesContext[currentPage].mediaBox.bottomLeftX) / k;
        },
        set: function set(value) {
          pagesContext[currentPage].mediaBox.topRightX = value * k + pagesContext[currentPage].mediaBox.bottomLeftX;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(API.internal.pageSize, 'height', {
        get: function get() {
          return (pagesContext[currentPage].mediaBox.topRightY - pagesContext[currentPage].mediaBox.bottomLeftY) / k;
        },
        set: function set(value) {
          pagesContext[currentPage].mediaBox.topRightY = value * k + pagesContext[currentPage].mediaBox.bottomLeftY;
        },
        enumerable: true,
        configurable: true
      }); //////////////////////////////////////////////////////
      // continuing initialization of jsPDF Document object
      //////////////////////////////////////////////////////
      // Add the first page automatically

      addFonts(standardFonts);
      activeFontKey = 'F1';

      _addPage(format, orientation);

      events.publish('initialized');
      return API;
    }
    /**
     * jsPDF.API is a STATIC property of jsPDF class.
     * jsPDF.API is an object you can add methods and properties to.
     * The methods / properties you add will show up in new jsPDF objects.
     *
     * One property is prepopulated. It is the 'events' Object. Plugin authors can add topics,
     * callbacks to this object. These will be reassigned to all new instances of jsPDF.
     *
     * @static
     * @public
     * @memberOf jsPDF
     * @name API
     *
     * @example
     * jsPDF.API.mymethod = function(){
     *   // 'this' will be ref to internal API object. see jsPDF source
     *   // , so you can refer to built-in methods like so:
     *   //     this.line(....)
     *   //     this.text(....)
     * }
     * var pdfdoc = new jsPDF()
     * pdfdoc.mymethod() // <- !!!!!!
     */


    jsPDF.API = {
      events: []
    };
    /**
     * The version of jsPDF.
     * @name version
     * @type {string}
     * @memberOf jsPDF
     */

    jsPDF.version = '1.5.3';

    if (typeof define === 'function' && define.amd) {
      define('jsPDF', function () {
        return jsPDF;
      });
    } else if (typeof module !== 'undefined' && module.exports) {
      module.exports = jsPDF;
      module.exports.jsPDF = jsPDF;
    } else {
      global.jsPDF = jsPDF;
    }

    return jsPDF;
  }(typeof self !== "undefined" && self || typeof window !== "undefined" && window || typeof global !== "undefined" && global || Function('return typeof this === "object" && this.content')() || Function('return this')()); // `self` is undefined in Firefox for Android content script context
  // while `this` is nsIContentFrameMessageManager
  // with an attribute `content` that corresponds to the window

  /** @license
   * jsPDF addImage plugin
   * Copyright (c) 2012 Jason Siefken, https://github.com/siefkenj/
   *               2013 Chris Dowling, https://github.com/gingerchris
   *               2013 Trinh Ho, https://github.com/ineedfat
   *               2013 Edwin Alejandro Perez, https://github.com/eaparango
   *               2013 Norah Smith, https://github.com/burnburnrocket
   *               2014 Diego Casorran, https://github.com/diegocr
   *               2014 James Robb, https://github.com/jamesbrobb
   *
   * Licensed under the MIT License
   */

  /**
  * @name addImage
  * @module
  */
  (function (jsPDFAPI) {

    var namespace = 'addImage_';
    var imageFileTypeHeaders = {
      PNG: [[0x89, 0x50, 0x4e, 0x47]],
      TIFF: [[0x4D, 0x4D, 0x00, 0x2A], //Motorola
      [0x49, 0x49, 0x2A, 0x00] //Intel
      ],
      JPEG: [[0xFF, 0xD8, 0xFF, 0xE0, undefined, undefined, 0x4A, 0x46, 0x49, 0x46, 0x00], //JFIF
      [0xFF, 0xD8, 0xFF, 0xE1, undefined, undefined, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00] //Exif
      ],
      JPEG2000: [[0x00, 0x00, 0x00, 0x0C, 0x6A, 0x50, 0x20, 0x20]],
      GIF87a: [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61]],
      GIF89a: [[0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
      BMP: [[0x42, 0x4D], //BM - Windows 3.1x, 95, NT, ... etc.
      [0x42, 0x41], //BA - OS/2 struct bitmap array
      [0x43, 0x49], //CI - OS/2 struct color icon
      [0x43, 0x50], //CP - OS/2 const color pointer
      [0x49, 0x43], //IC - OS/2 struct icon
      [0x50, 0x54] //PT - OS/2 pointer
      ]
    };
    /**
    * Recognize filetype of Image by magic-bytes
    * 
    * https://en.wikipedia.org/wiki/List_of_file_signatures
    *
    * @name getImageFileTypeByImageData
    * @public
    * @function
    * @param {string|arraybuffer} imageData imageData as binary String or arraybuffer
    * @param {string} format format of file if filetype-recognition fails, e.g. 'JPEG'
    * 
    * @returns {string} filetype of Image
    */

    var getImageFileTypeByImageData = jsPDFAPI.getImageFileTypeByImageData = function (imageData, fallbackFormat) {
      fallbackFormat = fallbackFormat || 'UNKNOWN';
      var i;
      var j;
      var result = 'UNKNOWN';
      var headerSchemata;
      var compareResult;
      var fileType;

      if (jsPDFAPI.isArrayBufferView(imageData)) {
        imageData = jsPDFAPI.arrayBufferToBinaryString(imageData);
      }

      for (fileType in imageFileTypeHeaders) {
        headerSchemata = imageFileTypeHeaders[fileType];

        for (i = 0; i < headerSchemata.length; i += 1) {
          compareResult = true;

          for (j = 0; j < headerSchemata[i].length; j += 1) {
            if (headerSchemata[i][j] === undefined) {
              continue;
            }

            if (headerSchemata[i][j] !== imageData.charCodeAt(j)) {
              compareResult = false;
              break;
            }
          }

          if (compareResult === true) {
            result = fileType;
            break;
          }
        }
      }

      if (result === 'UNKNOWN' && fallbackFormat !== 'UNKNOWN') {
        console.warn('FileType of Image not recognized. Processing image as "' + fallbackFormat + '".');
        result = fallbackFormat;
      }

      return result;
    }; // Image functionality ported from pdf.js


    var putImage = function putImage(img) {
      var objectNumber = this.internal.newObject(),
          out = this.internal.write,
          putStream = this.internal.putStream,
          getFilters = this.internal.getFilters;
      var filters = getFilters();

      while (filters.indexOf('FlateEncode') !== -1) {
        filters.splice(filters.indexOf('FlateEncode'), 1);
      }

      img['n'] = objectNumber;
      var additionalKeyValues = [];
      additionalKeyValues.push({
        key: 'Type',
        value: '/XObject'
      });
      additionalKeyValues.push({
        key: 'Subtype',
        value: '/Image'
      });
      additionalKeyValues.push({
        key: 'Width',
        value: img['w']
      });
      additionalKeyValues.push({
        key: 'Height',
        value: img['h']
      });

      if (img['cs'] === this.color_spaces.INDEXED) {
        additionalKeyValues.push({
          key: 'ColorSpace',
          value: '[/Indexed /DeviceRGB ' // if an indexed png defines more than one colour with transparency, we've created a smask
          + (img['pal'].length / 3 - 1) + ' ' + ('smask' in img ? objectNumber + 2 : objectNumber + 1) + ' 0 R]'
        });
      } else {
        additionalKeyValues.push({
          key: 'ColorSpace',
          value: '/' + img['cs']
        });

        if (img['cs'] === this.color_spaces.DEVICE_CMYK) {
          additionalKeyValues.push({
            key: 'Decode',
            value: '[1 0 1 0 1 0 1 0]'
          });
        }
      }

      additionalKeyValues.push({
        key: 'BitsPerComponent',
        value: img['bpc']
      });

      if ('dp' in img) {
        additionalKeyValues.push({
          key: 'DecodeParms',
          value: '<<' + img['dp'] + '>>'
        });
      }

      if ('trns' in img && img['trns'].constructor == Array) {
        var trns = '',
            i = 0,
            len = img['trns'].length;

        for (; i < len; i++) {
          trns += img['trns'][i] + ' ' + img['trns'][i] + ' ';
        }

        additionalKeyValues.push({
          key: 'Mask',
          value: '[' + trns + ']'
        });
      }

      if ('smask' in img) {
        additionalKeyValues.push({
          key: 'SMask',
          value: objectNumber + 1 + ' 0 R'
        });
      }

      var alreadyAppliedFilters = typeof img['f'] !== "undefined" ? ['/' + img['f']] : undefined;
      putStream({
        data: img['data'],
        additionalKeyValues: additionalKeyValues,
        alreadyAppliedFilters: alreadyAppliedFilters
      });
      out('endobj'); // Soft mask

      if ('smask' in img) {
        var dp = '/Predictor ' + img['p'] + ' /Colors 1 /BitsPerComponent ' + img['bpc'] + ' /Columns ' + img['w'];
        var smask = {
          'w': img['w'],
          'h': img['h'],
          'cs': 'DeviceGray',
          'bpc': img['bpc'],
          'dp': dp,
          'data': img['smask']
        };
        if ('f' in img) smask.f = img['f'];
        putImage.call(this, smask);
      } //Palette


      if (img['cs'] === this.color_spaces.INDEXED) {
        this.internal.newObject(); //out('<< /Filter / ' + img['f'] +' /Length ' + img['pal'].length + '>>');
        //putStream(zlib.compress(img['pal']));

        putStream({
          data: this.arrayBufferToBinaryString(new Uint8Array(img['pal']))
        });
        out('endobj');
      }
    },
        putResourcesCallback = function putResourcesCallback() {
      var images = this.internal.collections[namespace + 'images'];

      for (var i in images) {
        putImage.call(this, images[i]);
      }
    },
        putXObjectsDictCallback = function putXObjectsDictCallback() {
      var images = this.internal.collections[namespace + 'images'],
          out = this.internal.write,
          image;

      for (var i in images) {
        image = images[i];
        out('/I' + image['i'], image['n'], '0', 'R');
      }
    },
        checkCompressValue = function checkCompressValue(value) {
      if (value && typeof value === 'string') value = value.toUpperCase();
      return value in jsPDFAPI.image_compression ? value : jsPDFAPI.image_compression.NONE;
    },
        getImages = function getImages() {
      var images = this.internal.collections[namespace + 'images']; //first run, so initialise stuff

      if (!images) {
        this.internal.collections[namespace + 'images'] = images = {};
        this.internal.events.subscribe('putResources', putResourcesCallback);
        this.internal.events.subscribe('putXobjectDict', putXObjectsDictCallback);
      }

      return images;
    },
        getImageIndex = function getImageIndex(images) {
      var imageIndex = 0;

      if (images) {
        // this is NOT the first time this method is ran on this instance of jsPDF object.
        imageIndex = Object.keys ? Object.keys(images).length : function (o) {
          var i = 0;

          for (var e in o) {
            if (o.hasOwnProperty(e)) {
              i++;
            }
          }

          return i;
        }(images);
      }

      return imageIndex;
    },
        notDefined = function notDefined(value) {
      return typeof value === 'undefined' || value === null || value.length === 0;
    },
        generateAliasFromImageData = function generateAliasFromImageData(imageData) {
      if (typeof imageData === 'string') {
        return jsPDFAPI.sHashCode(imageData);
      }

      if (jsPDFAPI.isArrayBufferView(imageData)) {
        return jsPDFAPI.sHashCode(jsPDFAPI.arrayBufferToBinaryString(imageData));
      }

      return null;
    },
        isImageTypeSupported = function isImageTypeSupported(type) {
      return typeof jsPDFAPI["process" + type.toUpperCase()] === "function";
    },
        isDOMElement = function isDOMElement(object) {
      return _typeof(object) === 'object' && object.nodeType === 1;
    },
        createDataURIFromElement = function createDataURIFromElement(element, format) {
      //if element is an image which uses data url definition, just return the dataurl
      if (element.nodeName === 'IMG' && element.hasAttribute('src')) {
        var src = '' + element.getAttribute('src'); //is base64 encoded dataUrl, directly process it

        if (src.indexOf('data:image/') === 0) {
          return unescape(src);
        } //it is probably an url, try to load it


        var tmpImageData = jsPDFAPI.loadFile(src);

        if (tmpImageData !== undefined) {
          return btoa(tmpImageData);
        }
      }

      if (element.nodeName === 'CANVAS') {
        var canvas = element;
        return element.toDataURL('image/jpeg', 1.0);
      } //absolute fallback method


      var canvas = document.createElement('canvas');
      canvas.width = element.clientWidth || element.width;
      canvas.height = element.clientHeight || element.height;
      var ctx = canvas.getContext('2d');

      if (!ctx) {
        throw 'addImage requires canvas to be supported by browser.';
      }

      ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL(('' + format).toLowerCase() == 'png' ? 'image/png' : 'image/jpeg');
    },
        checkImagesForAlias = function checkImagesForAlias(alias, images) {
      var cached_info;

      if (images) {
        for (var e in images) {
          if (alias === images[e].alias) {
            cached_info = images[e];
            break;
          }
        }
      }

      return cached_info;
    },
        determineWidthAndHeight = function determineWidthAndHeight(w, h, info) {
      if (!w && !h) {
        w = -96;
        h = -96;
      }

      if (w < 0) {
        w = -1 * info['w'] * 72 / w / this.internal.scaleFactor;
      }

      if (h < 0) {
        h = -1 * info['h'] * 72 / h / this.internal.scaleFactor;
      }

      if (w === 0) {
        w = h * info['w'] / info['h'];
      }

      if (h === 0) {
        h = w * info['h'] / info['w'];
      }

      return [w, h];
    },
        writeImageToPDF = function writeImageToPDF(x, y, w, h, info, index, images, rotation) {
      var dims = determineWidthAndHeight.call(this, w, h, info),
          coord = this.internal.getCoordinateString,
          vcoord = this.internal.getVerticalCoordinateString;
      w = dims[0];
      h = dims[1];
      images[index] = info;

      if (rotation) {
        rotation *= Math.PI / 180;
        var c = Math.cos(rotation);
        var s = Math.sin(rotation); //like in pdf Reference do it 4 digits instead of 2

        var f4 = function f4(number) {
          return number.toFixed(4);
        };

        var rotationTransformationMatrix = [f4(c), f4(s), f4(s * -1), f4(c), 0, 0, 'cm'];
      }

      this.internal.write('q'); //Save graphics state

      if (rotation) {
        this.internal.write([1, '0', '0', 1, coord(x), vcoord(y + h), 'cm'].join(' ')); //Translate

        this.internal.write(rotationTransformationMatrix.join(' ')); //Rotate

        this.internal.write([coord(w), '0', '0', coord(h), '0', '0', 'cm'].join(' ')); //Scale
      } else {
        this.internal.write([coord(w), '0', '0', coord(h), coord(x), vcoord(y + h), 'cm'].join(' ')); //Translate and Scale
      }

      this.internal.write('/I' + info['i'] + ' Do'); //Paint Image

      this.internal.write('Q'); //Restore graphics state
    };
    /**
     * COLOR SPACES
     */


    jsPDFAPI.color_spaces = {
      DEVICE_RGB: 'DeviceRGB',
      DEVICE_GRAY: 'DeviceGray',
      DEVICE_CMYK: 'DeviceCMYK',
      CAL_GREY: 'CalGray',
      CAL_RGB: 'CalRGB',
      LAB: 'Lab',
      ICC_BASED: 'ICCBased',
      INDEXED: 'Indexed',
      PATTERN: 'Pattern',
      SEPARATION: 'Separation',
      DEVICE_N: 'DeviceN'
    };
    /**
     * DECODE METHODS
     */

    jsPDFAPI.decode = {
      DCT_DECODE: 'DCTDecode',
      FLATE_DECODE: 'FlateDecode',
      LZW_DECODE: 'LZWDecode',
      JPX_DECODE: 'JPXDecode',
      JBIG2_DECODE: 'JBIG2Decode',
      ASCII85_DECODE: 'ASCII85Decode',
      ASCII_HEX_DECODE: 'ASCIIHexDecode',
      RUN_LENGTH_DECODE: 'RunLengthDecode',
      CCITT_FAX_DECODE: 'CCITTFaxDecode'
    };
    /**
     * IMAGE COMPRESSION TYPES
     */

    jsPDFAPI.image_compression = {
      NONE: 'NONE',
      FAST: 'FAST',
      MEDIUM: 'MEDIUM',
      SLOW: 'SLOW'
    };
    /**
    * @name sHashCode
    * @function 
    * @param {string} str
    * @returns {string} 
    */

    jsPDFAPI.sHashCode = function (str) {
      str = str || "";
      var hash = 0,
          i,
          chr;
      if (str.length === 0) return hash;

      for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
      }

      return hash;
    };
    /**
    * @name isString
    * @function
    * @param {any} object
    * @returns {boolean} 
    */


    jsPDFAPI.isString = function (object) {
      return typeof object === 'string';
    };
    /**
    * Validates if given String is a valid Base64-String
    *
    * @name validateStringAsBase64
    * @public
    * @function
    * @param {String} possible Base64-String
    * 
    * @returns {boolean}
    */


    jsPDFAPI.validateStringAsBase64 = function (possibleBase64String) {
      possibleBase64String = possibleBase64String || '';
      possibleBase64String.toString().trim();
      var result = true;

      if (possibleBase64String.length === 0) {
        result = false;
      }

      if (possibleBase64String.length % 4 !== 0) {
        result = false;
      }

      if (/^[A-Za-z0-9+\/]+$/.test(possibleBase64String.substr(0, possibleBase64String.length - 2)) === false) {
        result = false;
      }

      if (/^[A-Za-z0-9\/][A-Za-z0-9+\/]|[A-Za-z0-9+\/]=|==$/.test(possibleBase64String.substr(-2)) === false) {
        result = false;
      }

      return result;
    };
    /**
     * Strips out and returns info from a valid base64 data URI
     *
     * @name extractInfoFromBase64DataURI
     * @function 
     * @param {string} dataUrl a valid data URI of format 'data:[<MIME-type>][;base64],<data>'
     * @returns {Array}an Array containing the following
     * [0] the complete data URI
     * [1] <MIME-type>
     * [2] format - the second part of the mime-type i.e 'png' in 'image/png'
     * [4] <data>
     */


    jsPDFAPI.extractInfoFromBase64DataURI = function (dataURI) {
      return /^data:([\w]+?\/([\w]+?));\S*;*base64,(.+)$/g.exec(dataURI);
    };
    /**
     * Strips out and returns info from a valid base64 data URI
     *
     * @name extractImageFromDataUrl
     * @function 
     * @param {string} dataUrl a valid data URI of format 'data:[<MIME-type>][;base64],<data>'
     * @returns {Array}an Array containing the following
     * [0] the complete data URI
     * [1] <MIME-type>
     * [2] format - the second part of the mime-type i.e 'png' in 'image/png'
     * [4] <data>
     */


    jsPDFAPI.extractImageFromDataUrl = function (dataUrl) {
      dataUrl = dataUrl || '';
      var dataUrlParts = dataUrl.split('base64,');
      var result = null;

      if (dataUrlParts.length === 2) {
        var extractedInfo = /^data:(\w*\/\w*);*(charset=[\w=-]*)*;*$/.exec(dataUrlParts[0]);

        if (Array.isArray(extractedInfo)) {
          result = {
            mimeType: extractedInfo[1],
            charset: extractedInfo[2],
            data: dataUrlParts[1]
          };
        }
      }

      return result;
    };
    /**
     * Check to see if ArrayBuffer is supported
     * 
     * @name supportsArrayBuffer
     * @function
     * @returns {boolean}
     */


    jsPDFAPI.supportsArrayBuffer = function () {
      return typeof ArrayBuffer !== 'undefined' && typeof Uint8Array !== 'undefined';
    };
    /**
     * Tests supplied object to determine if ArrayBuffer
     *
     * @name isArrayBuffer
     * @function 
     * @param {Object} object an Object
     * 
     * @returns {boolean}
     */


    jsPDFAPI.isArrayBuffer = function (object) {
      if (!this.supportsArrayBuffer()) return false;
      return object instanceof ArrayBuffer;
    };
    /**
     * Tests supplied object to determine if it implements the ArrayBufferView (TypedArray) interface
     *
     * @name isArrayBufferView
     * @function 
     * @param {Object} object an Object
     * @returns {boolean}
     */


    jsPDFAPI.isArrayBufferView = function (object) {
      if (!this.supportsArrayBuffer()) return false;
      if (typeof Uint32Array === 'undefined') return false;
      return object instanceof Int8Array || object instanceof Uint8Array || typeof Uint8ClampedArray !== 'undefined' && object instanceof Uint8ClampedArray || object instanceof Int16Array || object instanceof Uint16Array || object instanceof Int32Array || object instanceof Uint32Array || object instanceof Float32Array || object instanceof Float64Array;
    };
    /**
    * Convert the Buffer to a Binary String
    *
    * @name binaryStringToUint8Array
    * @public
    * @function
    * @param {ArrayBuffer} BinaryString with ImageData
    * 
    * @returns {Uint8Array}
    */


    jsPDFAPI.binaryStringToUint8Array = function (binary_string) {
      /*
       * not sure how efficient this will be will bigger files. Is there a native method?
       */
      var len = binary_string.length;
      var bytes = new Uint8Array(len);

      for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }

      return bytes;
    };
    /**
    * Convert the Buffer to a Binary String
    *
    * @name arrayBufferToBinaryString
    * @public
    * @function
    * @param {ArrayBuffer} ArrayBuffer with ImageData
    * 
    * @returns {String}
    */


    jsPDFAPI.arrayBufferToBinaryString = function (buffer) {
      // if (typeof Uint8Array !== 'undefined' && typeof Uint8Array.prototype.reduce !== 'undefined') {
      // return new Uint8Array(buffer).reduce(function (data, byte) {
      // return data.push(String.fromCharCode(byte)), data;
      // }, []).join('');
      // }
      if (typeof atob === "function") {
        return atob(this.arrayBufferToBase64(buffer));
      }
    };
    /**
    * Converts an ArrayBuffer directly to base64
    *
    * Taken from  http://jsperf.com/encoding-xhr-image-data/31
    *
    * Need to test if this is a better solution for larger files
    *
    * @name arrayBufferToBase64
    * @param {arraybuffer} arrayBuffer
    * @public
    * @function
    * 
    * @returns {string}
    */


    jsPDFAPI.arrayBufferToBase64 = function (arrayBuffer) {
      var base64 = '';
      var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      var bytes = new Uint8Array(arrayBuffer);
      var byteLength = bytes.byteLength;
      var byteRemainder = byteLength % 3;
      var mainLength = byteLength - byteRemainder;
      var a, b, c, d;
      var chunk; // Main loop deals with bytes in chunks of 3

      for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2]; // Use bitmasks to extract 6-bit segments from the triplet

        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18

        b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12

        c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6

        d = chunk & 63; // 63       = 2^6 - 1
        // Convert the raw binary segments to the appropriate ASCII encoding

        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
      } // Deal with the remaining bytes and padding


      if (byteRemainder == 1) {
        chunk = bytes[mainLength];
        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
        // Set the 4 least significant bits to zero

        b = (chunk & 3) << 4; // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '==';
      } else if (byteRemainder == 2) {
        chunk = bytes[mainLength] << 8 | bytes[mainLength + 1];
        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10

        b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
        // Set the 2 least significant bits to zero

        c = (chunk & 15) << 2; // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
      }

      return base64;
    };
    /**
    * 
    * @name createImageInfo
    * @param {Object} data 
    * @param {number} wd width
    * @param {number} ht height
    * @param {Object} cs colorSpace
    * @param {number} bpc bits per channel
    * @param {any} f 
    * @param {number} imageIndex
    * @param {string} alias
    * @param {any} dp
    * @param {any} trns
    * @param {any} pal
    * @param {any} smask
    * @param {any} p
    * @public
    * @function
    * 
    * @returns {Object}
    */


    jsPDFAPI.createImageInfo = function (data, wd, ht, cs, bpc, f, imageIndex, alias, dp, trns, pal, smask, p) {
      var info = {
        alias: alias,
        w: wd,
        h: ht,
        cs: cs,
        bpc: bpc,
        i: imageIndex,
        data: data // n: objectNumber will be added by putImage code

      };
      if (f) info.f = f;
      if (dp) info.dp = dp;
      if (trns) info.trns = trns;
      if (pal) info.pal = pal;
      if (smask) info.smask = smask;
      if (p) info.p = p; // predictor parameter for PNG compression

      return info;
    };
    /**
    * Adds an Image to the PDF.
    *
    * @name addImage
    * @public
    * @function
    * @param {string/Image-Element/Canvas-Element/Uint8Array} imageData imageData as base64 encoded DataUrl or Image-HTMLElement or Canvas-HTMLElement
    * @param {string} format format of file if filetype-recognition fails, e.g. 'JPEG'
    * @param {number} x x Coordinate (in units declared at inception of PDF document) against left edge of the page
    * @param {number} y y Coordinate (in units declared at inception of PDF document) against upper edge of the page
    * @param {number} width width of the image (in units declared at inception of PDF document)
    * @param {number} height height of the Image (in units declared at inception of PDF document)
    * @param {string} alias alias of the image (if used multiple times)
    * @param {string} compression compression of the generated JPEG, can have the values 'NONE', 'FAST', 'MEDIUM' and 'SLOW'
    * @param {number} rotation rotation of the image in degrees (0-359)
    * 
    * @returns jsPDF
    */


    jsPDFAPI.addImage = function (imageData, format, x, y, w, h, alias, compression, rotation) {

      var tmpImageData = '';

      if (typeof format !== 'string') {
        var tmp = h;
        h = w;
        w = y;
        y = x;
        x = format;
        format = tmp;
      }

      if (_typeof(imageData) === 'object' && !isDOMElement(imageData) && "imageData" in imageData) {
        var options = imageData;
        imageData = options.imageData;
        format = options.format || format || 'UNKNOWN';
        x = options.x || x || 0;
        y = options.y || y || 0;
        w = options.w || w;
        h = options.h || h;
        alias = options.alias || alias;
        compression = options.compression || compression;
        rotation = options.rotation || options.angle || rotation;
      } //If compression is not explicitly set, determine if we should use compression


      var filters = this.internal.getFilters();

      if (compression === undefined && filters.indexOf('FlateEncode') !== -1) {
        compression = 'SLOW';
      }

      if (typeof imageData === "string") {
        imageData = unescape(imageData);
      }

      if (isNaN(x) || isNaN(y)) {
        console.error('jsPDF.addImage: Invalid coordinates', arguments);
        throw new Error('Invalid coordinates passed to jsPDF.addImage');
      }

      var images = getImages.call(this),
          info,
          dataAsBinaryString;

      if (!(info = checkImagesForAlias(imageData, images))) {
        if (isDOMElement(imageData)) imageData = createDataURIFromElement(imageData, format);
        if (notDefined(alias)) alias = generateAliasFromImageData(imageData);

        if (!(info = checkImagesForAlias(alias, images))) {
          if (this.isString(imageData)) {
            tmpImageData = this.convertStringToImageData(imageData);

            if (tmpImageData !== '') {
              imageData = tmpImageData;
            } else {
              tmpImageData = jsPDFAPI.loadFile(imageData);

              if (tmpImageData !== undefined) {
                imageData = tmpImageData;
              }
            }
          }

          format = this.getImageFileTypeByImageData(imageData, format);
          if (!isImageTypeSupported(format)) throw new Error('addImage does not support files of type \'' + format + '\', please ensure that a plugin for \'' + format + '\' support is added.');
          /**
           * need to test if it's more efficient to convert all binary strings
           * to TypedArray - or should we just leave and process as string?
           */

          if (this.supportsArrayBuffer()) {
            // no need to convert if imageData is already uint8array
            if (!(imageData instanceof Uint8Array)) {
              dataAsBinaryString = imageData;
              imageData = this.binaryStringToUint8Array(imageData);
            }
          }

          info = this['process' + format.toUpperCase()](imageData, getImageIndex(images), alias, checkCompressValue(compression), dataAsBinaryString);

          if (!info) {
            throw new Error('An unknown error occurred whilst processing the image');
          }
        }
      }

      writeImageToPDF.call(this, x, y, w, h, info, info.i, images, rotation);
      return this;
    };
    /**
    * @name convertStringToImageData
    * @function
    * @param {string} stringData
    * @returns {string} binary data
    */


    jsPDFAPI.convertStringToImageData = function (stringData) {
      var base64Info;
      var imageData = '';
      var rawData;

      if (this.isString(stringData)) {
        var base64Info = this.extractImageFromDataUrl(stringData);
        rawData = base64Info !== null ? base64Info.data : stringData;

        try {
          imageData = atob(rawData);
        } catch (e) {
          if (!jsPDFAPI.validateStringAsBase64(rawData)) {
            throw new Error('Supplied Data is not a valid base64-String jsPDF.convertStringToImageData ');
          } else {
            throw new Error('atob-Error in jsPDF.convertStringToImageData ' + e.message);
          }
        }
      }

      return imageData;
    };
    /**
     * JPEG SUPPORT
     **/
    //takes a string imgData containing the raw bytes of
    //a jpeg image and returns [width, height]
    //Algorithm from: http://www.64lines.com/jpeg-width-height


    var getJpegSize = function getJpegSize(imgData) {

      var width, height, numcomponents; // Verify we have a valid jpeg header 0xff,0xd8,0xff,0xe0,?,?,'J','F','I','F',0x00

      if (getImageFileTypeByImageData(imgData) !== 'JPEG') {
        throw new Error('getJpegSize requires a binary string jpeg file');
      }

      var blockLength = imgData.charCodeAt(4) * 256 + imgData.charCodeAt(5);
      var i = 4,
          len = imgData.length;

      while (i < len) {
        i += blockLength;

        if (imgData.charCodeAt(i) !== 0xff) {
          throw new Error('getJpegSize could not find the size of the image');
        }

        if (imgData.charCodeAt(i + 1) === 0xc0 || //(SOF) Huffman  - Baseline DCT
        imgData.charCodeAt(i + 1) === 0xc1 || //(SOF) Huffman  - Extended sequential DCT
        imgData.charCodeAt(i + 1) === 0xc2 || // Progressive DCT (SOF2)
        imgData.charCodeAt(i + 1) === 0xc3 || // Spatial (sequential) lossless (SOF3)
        imgData.charCodeAt(i + 1) === 0xc4 || // Differential sequential DCT (SOF5)
        imgData.charCodeAt(i + 1) === 0xc5 || // Differential progressive DCT (SOF6)
        imgData.charCodeAt(i + 1) === 0xc6 || // Differential spatial (SOF7)
        imgData.charCodeAt(i + 1) === 0xc7) {
          height = imgData.charCodeAt(i + 5) * 256 + imgData.charCodeAt(i + 6);
          width = imgData.charCodeAt(i + 7) * 256 + imgData.charCodeAt(i + 8);
          numcomponents = imgData.charCodeAt(i + 9);
          return [width, height, numcomponents];
        } else {
          i += 2;
          blockLength = imgData.charCodeAt(i) * 256 + imgData.charCodeAt(i + 1);
        }
      }
    },
        getJpegSizeFromBytes = function getJpegSizeFromBytes(data) {
      var hdr = data[0] << 8 | data[1];
      if (hdr !== 0xFFD8) throw new Error('Supplied data is not a JPEG');
      var len = data.length,
          block = (data[4] << 8) + data[5],
          pos = 4,
          bytes,
          width,
          height,
          numcomponents;

      while (pos < len) {
        pos += block;
        bytes = readBytes(data, pos);
        block = (bytes[2] << 8) + bytes[3];

        if ((bytes[1] === 0xC0 || bytes[1] === 0xC2) && bytes[0] === 0xFF && block > 7) {
          bytes = readBytes(data, pos + 5);
          width = (bytes[2] << 8) + bytes[3];
          height = (bytes[0] << 8) + bytes[1];
          numcomponents = bytes[4];
          return {
            width: width,
            height: height,
            numcomponents: numcomponents
          };
        }

        pos += 2;
      }

      throw new Error('getJpegSizeFromBytes could not find the size of the image');
    },
        readBytes = function readBytes(data, offset) {
      return data.subarray(offset, offset + 5);
    };
    /**
    * @ignore
    */


    jsPDFAPI.processJPEG = function (data, index, alias, compression, dataAsBinaryString, colorSpace) {

      var filter = this.decode.DCT_DECODE,
          bpc = 8,
          dims;

      if (!this.isString(data) && !this.isArrayBuffer(data) && !this.isArrayBufferView(data)) {
        return null;
      }

      if (this.isString(data)) {
        dims = getJpegSize(data);
      }

      if (this.isArrayBuffer(data)) {
        data = new Uint8Array(data);
      }

      if (this.isArrayBufferView(data)) {
        dims = getJpegSizeFromBytes(data); // if we already have a stored binary string rep use that

        data = dataAsBinaryString || this.arrayBufferToBinaryString(data);
      }

      if (colorSpace === undefined) {
        switch (dims.numcomponents) {
          case 1:
            colorSpace = this.color_spaces.DEVICE_GRAY;
            break;

          case 4:
            colorSpace = this.color_spaces.DEVICE_CMYK;
            break;

          default:
          case 3:
            colorSpace = this.color_spaces.DEVICE_RGB;
            break;
        }
      }

      return this.createImageInfo(data, dims.width, dims.height, colorSpace, bpc, filter, index, alias);
    };
    /**
    * @ignore
    */


    jsPDFAPI.processJPG = function ()
    /*data, index, alias, compression, dataAsBinaryString*/
    {
      return this.processJPEG.apply(this, arguments);
    };
    /**
    * @name getImageProperties
    * @function
    * @param {Object} imageData
    * @returns {Object}
    */


    jsPDFAPI.getImageProperties = function (imageData) {
      var info;
      var tmpImageData = '';
      var format;

      if (isDOMElement(imageData)) {
        imageData = createDataURIFromElement(imageData);
      }

      if (this.isString(imageData)) {
        tmpImageData = this.convertStringToImageData(imageData);

        if (tmpImageData !== '') {
          imageData = tmpImageData;
        } else {
          tmpImageData = jsPDFAPI.loadFile(imageData);

          if (tmpImageData !== undefined) {
            imageData = tmpImageData;
          }
        }
      }

      format = this.getImageFileTypeByImageData(imageData);

      if (!isImageTypeSupported(format)) {
        throw new Error('addImage does not support files of type \'' + format + '\', please ensure that a plugin for \'' + format + '\' support is added.');
      }
      /**
       * need to test if it's more efficient to convert all binary strings
       * to TypedArray - or should we just leave and process as string?
       */


      if (this.supportsArrayBuffer()) {
        // no need to convert if imageData is already uint8array
        if (!(imageData instanceof Uint8Array)) {
          imageData = this.binaryStringToUint8Array(imageData);
        }
      }

      info = this['process' + format.toUpperCase()](imageData);

      if (!info) {
        throw new Error('An unknown error occurred whilst processing the image');
      }

      return {
        fileType: format,
        width: info.w,
        height: info.h,
        colorSpace: info.cs,
        compressionMode: info.f,
        bitsPerComponent: info.bpc
      };
    };
  })(jsPDF.API);

  /**
   * @license
   * Copyright (c) 2014 Steven Spungin (TwelveTone LLC)  steven@twelvetone.tv
   *
   * Licensed under the MIT License.
   * http://opensource.org/licenses/mit-license
   */

  /**
   * jsPDF Annotations PlugIn
   *
   * There are many types of annotations in a PDF document. Annotations are placed
   * on a page at a particular location. They are not 'attached' to an object.
   * <br />
   * This plugin current supports <br />
   * <li> Goto Page (set pageNumber and top in options)
   * <li> Goto Name (set name and top in options)
   * <li> Goto URL (set url in options)
   * <p>
   * 	The destination magnification factor can also be specified when goto is a page number or a named destination. (see documentation below)
   *  (set magFactor in options).  XYZ is the default.
   * </p>
   * <p>
   *  Links, Text, Popup, and FreeText are supported.
   * </p>
   * <p>
   * Options In PDF spec Not Implemented Yet
   * <li> link border
   * <li> named target
   * <li> page coordinates
   * <li> destination page scaling and layout
   * <li> actions other than URL and GotoPage
   * <li> background / hover actions
   * </p>
   * @name annotations
   * @module
   */

  /*
      Destination Magnification Factors
      See PDF 1.3 Page 386 for meanings and options

      [supported]
  	XYZ (options; left top zoom)
  	Fit (no options)
  	FitH (options: top)
  	FitV (options: left)

  	[not supported]
  	FitR
  	FitB
  	FitBH
  	FitBV
   */
  (function (jsPDFAPI) {

    jsPDF.API.events.push(['addPage', function (addPageData) {
      var pageInfo = this.internal.getPageInfo(addPageData.pageNumber);
      pageInfo.pageContext.annotations = [];
    }]);
    jsPDFAPI.events.push(['putPage', function (putPageData) {
      var pageInfo = this.internal.getPageInfoByObjId(putPageData.objId);
      var pageAnnos = putPageData.pageContext.annotations;

      var notEmpty = function notEmpty(obj) {
        if (typeof obj != 'undefined') {
          if (obj != '') {
            return true;
          }
        }
      };

      var found = false;

      for (var a = 0; a < pageAnnos.length && !found; a++) {
        var anno = pageAnnos[a];

        switch (anno.type) {
          case 'link':
            if (notEmpty(anno.options.url) || notEmpty(anno.options.pageNumber)) {
              found = true;
              break;
            }

          case 'reference':
          case 'text':
          case 'freetext':
            found = true;
            break;
        }
      }

      if (found == false) {
        return;
      }

      this.internal.write("/Annots [");
      var pageHeight = this.internal.pageSize.height;
      var getHorizontalCoordinateString = this.internal.getCoordinateString;
      var getVerticalCoordinateString = this.internal.getVerticalCoordinateString;

      for (var a = 0; a < pageAnnos.length; a++) {
        var anno = pageAnnos[a];

        switch (anno.type) {
          case 'reference':
            // References to Widget Annotations (for AcroForm Fields)
            this.internal.write(' ' + anno.object.objId + ' 0 R ');
            break;

          case 'text':
            // Create a an object for both the text and the popup
            var objText = this.internal.newAdditionalObject();
            var objPopup = this.internal.newAdditionalObject();
            var title = anno.title || 'Note';
            var rect = "/Rect [" + getHorizontalCoordinateString(anno.bounds.x) + " " + getVerticalCoordinateString(anno.bounds.y + anno.bounds.h) + " " + getHorizontalCoordinateString(anno.bounds.x + anno.bounds.w) + " " + getVerticalCoordinateString(anno.bounds.y) + "] ";
            line = '<</Type /Annot /Subtype /' + 'Text' + ' ' + rect + '/Contents (' + anno.contents + ')';
            line += ' /Popup ' + objPopup.objId + " 0 R";
            line += ' /P ' + pageInfo.objId + " 0 R";
            line += ' /T (' + title + ') >>';
            objText.content = line;
            var parent = objText.objId + ' 0 R';
            var popoff = 30;
            var rect = "/Rect [" + getHorizontalCoordinateString(anno.bounds.x + popoff) + " " + getVerticalCoordinateString(anno.bounds.y + anno.bounds.h) + " " + getHorizontalCoordinateString(anno.bounds.x + anno.bounds.w + popoff) + " " + getVerticalCoordinateString(anno.bounds.y) + "] ";
            line = '<</Type /Annot /Subtype /' + 'Popup' + ' ' + rect + ' /Parent ' + parent;

            if (anno.open) {
              line += ' /Open true';
            }

            line += ' >>';
            objPopup.content = line;
            this.internal.write(objText.objId, '0 R', objPopup.objId, '0 R');
            break;

          case 'freetext':
            var rect = "/Rect [" + getHorizontalCoordinateString(anno.bounds.x) + " " + getVerticalCoordinateString(anno.bounds.y) + " " + getHorizontalCoordinateString(anno.bounds.x + anno.bounds.w) + " " + getVerticalCoordinateString(anno.bounds.y + anno.bounds.h) + "] ";
            var color = anno.color || '#000000';
            line = '<</Type /Annot /Subtype /' + 'FreeText' + ' ' + rect + '/Contents (' + anno.contents + ')';
            line += ' /DS(font: Helvetica,sans-serif 12.0pt; text-align:left; color:#' + color + ')';
            line += ' /Border [0 0 0]';
            line += ' >>';
            this.internal.write(line);
            break;

          case 'link':
            if (anno.options.name) {
              var loc = this.annotations._nameMap[anno.options.name];
              anno.options.pageNumber = loc.page;
              anno.options.top = loc.y;
            } else {
              if (!anno.options.top) {
                anno.options.top = 0;
              }
            }

            var rect = "/Rect [" + getHorizontalCoordinateString(anno.x) + " " + getVerticalCoordinateString(anno.y) + " " + getHorizontalCoordinateString(anno.x + anno.w) + " " + getVerticalCoordinateString(anno.y + anno.h) + "] ";
            var line = '';

            if (anno.options.url) {
              line = '<</Type /Annot /Subtype /Link ' + rect + '/Border [0 0 0] /A <</S /URI /URI (' + anno.options.url + ') >>';
            } else if (anno.options.pageNumber) {
              // first page is 0
              var info = this.internal.getPageInfo(anno.options.pageNumber);
              line = '<</Type /Annot /Subtype /Link ' + rect + '/Border [0 0 0] /Dest [' + info.objId + " 0 R";
              anno.options.magFactor = anno.options.magFactor || "XYZ";

              switch (anno.options.magFactor) {
                case 'Fit':
                  line += ' /Fit]';
                  break;

                case 'FitH':
                  line += ' /FitH ' + anno.options.top + ']';
                  break;

                case 'FitV':
                  anno.options.left = anno.options.left || 0;
                  line += ' /FitV ' + anno.options.left + ']';
                  break;

                case 'XYZ':
                default:
                  var top = getVerticalCoordinateString(anno.options.top);
                  anno.options.left = anno.options.left || 0; // 0 or null zoom will not change zoom factor

                  if (typeof anno.options.zoom === 'undefined') {
                    anno.options.zoom = 0;
                  }

                  line += ' /XYZ ' + anno.options.left + ' ' + top + ' ' + anno.options.zoom + ']';
                  break;
              }
            }

            if (line != '') {
              line += " >>";
              this.internal.write(line);
            }

            break;
        }
      }

      this.internal.write("]");
    }]);
    /**
    * @name createAnnotation
    * @function
    * @param {Object} options 
    */

    jsPDFAPI.createAnnotation = function (options) {
      var pageInfo = this.internal.getCurrentPageInfo();

      switch (options.type) {
        case 'link':
          this.link(options.bounds.x, options.bounds.y, options.bounds.w, options.bounds.h, options);
          break;

        case 'text':
        case 'freetext':
          pageInfo.pageContext.annotations.push(options);
          break;
      }
    };
    /**
     * Create a link
     *
     * valid options
     * <li> pageNumber or url [required]
     * <p>If pageNumber is specified, top and zoom may also be specified</p>
     * @name link
     * @function
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {Object} options
     */


    jsPDFAPI.link = function (x, y, w, h, options) {
      var pageInfo = this.internal.getCurrentPageInfo();
      pageInfo.pageContext.annotations.push({
        x: x,
        y: y,
        w: w,
        h: h,
        options: options,
        type: 'link'
      });
    };
    /**
     * Currently only supports single line text.
     * Returns the width of the text/link
     *
     * @name textWithLink
     * @function
     * @param {string} text
     * @param {number} x
     * @param {number} y
     * @param {Object} options
     * @returns {number} width the width of the text/link
     */


    jsPDFAPI.textWithLink = function (text, x, y, options) {
      var width = this.getTextWidth(text);
      var height = this.internal.getLineHeight() / this.internal.scaleFactor;
      this.text(text, x, y); //TODO We really need the text baseline height to do this correctly.
      // Or ability to draw text on top, bottom, center, or baseline.

      y += height * .2;
      this.link(x, y - height, width, height, options);
      return width;
    }; //TODO move into external library

    /**
    * @name getTextWidth
    * @function
    * @param {string} text
    * @returns {number} txtWidth
    */


    jsPDFAPI.getTextWidth = function (text) {
      var fontSize = this.internal.getFontSize();
      var txtWidth = this.getStringUnitWidth(text) * fontSize / this.internal.scaleFactor;
      return txtWidth;
    };

    return this;
  })(jsPDF.API);

  /**
   * @license
   * Copyright (c) 2014 Steven Spungin (TwelveTone LLC)  steven@twelvetone.tv
   *
   * Licensed under the MIT License.
   * http://opensource.org/licenses/mit-license
   */

  /**
   * jsPDF Canvas PlugIn
   * This plugin mimics the HTML5 Canvas
   * 
   * The goal is to provide a way for current canvas users to print directly to a PDF.
   * @name canvas
   * @module
   */
  (function (jsPDFAPI) {
    /**
    * @class Canvas
    * @classdesc A Canvas Wrapper for jsPDF
    */

    var Canvas = function Canvas() {
      var jsPdfInstance = undefined;
      Object.defineProperty(this, 'pdf', {
        get: function get() {
          return jsPdfInstance;
        },
        set: function set(value) {
          jsPdfInstance = value;
        }
      });
      var _width = 150;
      /**
      * The height property is a positive integer reflecting the height HTML attribute of the <canvas> element interpreted in CSS pixels. When the attribute is not specified, or if it is set to an invalid value, like a negative, the default value of 150 is used.
      * This is one of the two properties, the other being width, that controls the size of the canvas.
      *
      * @name width
      */

      Object.defineProperty(this, 'width', {
        get: function get() {
          return _width;
        },
        set: function set(value) {
          if (isNaN(value) || Number.isInteger(value) === false || value < 0) {
            _width = 150;
          } else {
            _width = value;
          }

          if (this.getContext('2d').pageWrapXEnabled) {
            this.getContext('2d').pageWrapX = _width + 1;
          }
        }
      });
      var _height = 300;
      /**
      * The width property is a positive integer reflecting the width HTML attribute of the <canvas> element interpreted in CSS pixels. When the attribute is not specified, or if it is set to an invalid value, like a negative, the default value of 300 is used.
      * This is one of the two properties, the other being height, that controls the size of the canvas.
      *
      * @name height
      */

      Object.defineProperty(this, 'height', {
        get: function get() {
          return _height;
        },
        set: function set(value) {
          if (isNaN(value) || Number.isInteger(value) === false || value < 0) {
            _height = 300;
          } else {
            _height = value;
          }

          if (this.getContext('2d').pageWrapYEnabled) {
            this.getContext('2d').pageWrapY = _height + 1;
          }
        }
      });
      var _childNodes = [];
      Object.defineProperty(this, 'childNodes', {
        get: function get() {
          return _childNodes;
        },
        set: function set(value) {
          _childNodes = value;
        }
      });
      var _style = {};
      Object.defineProperty(this, 'style', {
        get: function get() {
          return _style;
        },
        set: function set(value) {
          _style = value;
        }
      });
      Object.defineProperty(this, 'parentNode', {
        get: function get() {
          return false;
        }
      });
    };
    /**
    * The getContext() method returns a drawing context on the canvas, or null if the context identifier is not supported.
    * 
    * @name getContext
    * @function
    * @param {string} contextType Is a String containing the context identifier defining the drawing context associated to the canvas. Possible value is "2d", leading to the creation of a Context2D object representing a two-dimensional rendering context.
    * @param {object} contextAttributes
    */


    Canvas.prototype.getContext = function (contextType, contextAttributes) {
      contextType = contextType || '2d';
      var key;

      if (contextType !== '2d') {
        return null;
      }

      for (key in contextAttributes) {
        if (this.pdf.context2d.hasOwnProperty(key)) {
          this.pdf.context2d[key] = contextAttributes[key];
        }
      }

      this.pdf.context2d._canvas = this;
      return this.pdf.context2d;
    };
    /**
    * The toDataURL() method is just a stub to throw an error if accidently called.
    * 
    * @name toDataURL
    * @function
    */


    Canvas.prototype.toDataURL = function () {
      throw new Error('toDataURL is not implemented.');
    };

    jsPDFAPI.events.push(['initialized', function () {
      this.canvas = new Canvas();
      this.canvas.pdf = this;
    }]);
    return this;
  })(jsPDF.API);

  /**
   * jsPDF Context2D PlugIn Copyright (c) 2014 Steven Spungin (TwelveTone LLC) steven@twelvetone.tv
   *
   * Licensed under the MIT License. http://opensource.org/licenses/mit-license
   */

  /**
  * This plugin mimics the HTML5 CanvasRenderingContext2D.
  *
  * The goal is to provide a way for current canvas implementations to print directly to a PDF.
  *
  * @name context2d
  * @module
  */
  (function (jsPDFAPI, globalObj) {

    var ContextLayer = function ContextLayer(ctx) {
      ctx = ctx || {};
      this.isStrokeTransparent = ctx.isStrokeTransparent || false;
      this.strokeOpacity = ctx.strokeOpacity || 1;
      this.strokeStyle = ctx.strokeStyle || '#000000';
      this.fillStyle = ctx.fillStyle || '#000000';
      this.isFillTransparent = ctx.isFillTransparent || false;
      this.fillOpacity = ctx.fillOpacity || 1;
      this.font = ctx.font || '10px sans-serif';
      this.textBaseline = ctx.textBaseline || 'alphabetic';
      this.textAlign = ctx.textAlign || 'left';
      this.lineWidth = ctx.lineWidth || 1;
      this.lineJoin = ctx.lineJoin || 'miter';
      this.lineCap = ctx.lineCap || 'butt';
      this.path = ctx.path || [];
      this.transform = typeof ctx.transform !== 'undefined' ? ctx.transform.clone() : new Matrix();
      this.globalCompositeOperation = ctx.globalCompositeOperation || 'normal';
      this.globalAlpha = ctx.globalAlpha || 1.0;
      this.clip_path = ctx.clip_path || [];
      this.currentPoint = ctx.currentPoint || new Point();
      this.miterLimit = ctx.miterLimit || 10.0;
      this.lastPoint = ctx.lastPoint || new Point();
      this.ignoreClearRect = typeof ctx.ignoreClearRect === "boolean" ? ctx.ignoreClearRect : true;
      return this;
    }; //stub


    var f2, f3, getHorizontalCoordinateString, getVerticalCoordinateString, getHorizontalCoordinate, getVerticalCoordinate;
    jsPDFAPI.events.push(['initialized', function () {
      this.context2d = new Context2D(this);
      f2 = this.internal.f2;
      f3 = this.internal.f3;
      getHorizontalCoordinateString = this.internal.getCoordinateString;
      getVerticalCoordinateString = this.internal.getVerticalCoordinateString;
      getHorizontalCoordinate = this.internal.getHorizontalCoordinate;
      getVerticalCoordinate = this.internal.getVerticalCoordinate;
    }]);

    var Context2D = function Context2D(pdf) {
      Object.defineProperty(this, 'canvas', {
        get: function get() {
          return {
            parentNode: false,
            style: false
          };
        }
      });
      Object.defineProperty(this, 'pdf', {
        get: function get() {
          return pdf;
        }
      });
      var _pageWrapXEnabled = false;
      /**
      * @name pageWrapXEnabled
      * @type {boolean}
      * @default false
      */

      Object.defineProperty(this, 'pageWrapXEnabled', {
        get: function get() {
          return _pageWrapXEnabled;
        },
        set: function set(value) {
          _pageWrapXEnabled = Boolean(value);
        }
      });
      var _pageWrapYEnabled = false;
      /**
      * @name pageWrapYEnabled
      * @type {boolean}
      * @default true
      */

      Object.defineProperty(this, 'pageWrapYEnabled', {
        get: function get() {
          return _pageWrapYEnabled;
        },
        set: function set(value) {
          _pageWrapYEnabled = Boolean(value);
        }
      });
      var _posX = 0;
      /**
      * @name posX
      * @type {number}
      * @default 0
      */

      Object.defineProperty(this, 'posX', {
        get: function get() {
          return _posX;
        },
        set: function set(value) {
          if (!isNaN(value)) {
            _posX = value;
          }
        }
      });
      var _posY = 0;
      /**
      * @name posY
      * @type {number}
      * @default 0
      */

      Object.defineProperty(this, 'posY', {
        get: function get() {
          return _posY;
        },
        set: function set(value) {
          if (!isNaN(value)) {
            _posY = value;
          }
        }
      });
      var _autoPaging = false;
      /**
      * @name autoPaging
      * @type {boolean}
      * @default true
      */

      Object.defineProperty(this, 'autoPaging', {
        get: function get() {
          return _autoPaging;
        },
        set: function set(value) {
          _autoPaging = Boolean(value);
        }
      });
      var lastBreak = 0;
      /**
      * @name lastBreak
      * @type {number}
      * @default 0
      */

      Object.defineProperty(this, 'lastBreak', {
        get: function get() {
          return lastBreak;
        },
        set: function set(value) {
          lastBreak = value;
        }
      });
      var pageBreaks = [];
      /**
      * Y Position of page breaks.
      * @name pageBreaks
      * @type {number}
      * @default 0
      */

      Object.defineProperty(this, 'pageBreaks', {
        get: function get() {
          return pageBreaks;
        },
        set: function set(value) {
          pageBreaks = value;
        }
      });

      var _ctx = new ContextLayer();
      /**
      * @name ctx
      * @type {object}
      * @default {}
      */


      Object.defineProperty(this, 'ctx', {
        get: function get() {
          return _ctx;
        },
        set: function set(value) {
          if (value instanceof ContextLayer) {
            _ctx = value;
          }
        }
      });
      /**
      * @name path
      * @type {array}
      * @default []
      */

      Object.defineProperty(this, 'path', {
        get: function get() {
          return _ctx.path;
        },
        set: function set(value) {
          _ctx.path = value;
        }
      });
      /**
      * @name ctxStack
      * @type {array}
      * @default []
      */

      var _ctxStack = [];
      Object.defineProperty(this, 'ctxStack', {
        get: function get() {
          return _ctxStack;
        },
        set: function set(value) {
          _ctxStack = value;
        }
      });
      /**
      * Sets or returns the color, gradient, or pattern used to fill the drawing
      *
      * @name fillStyle
      * @default #000000
      * @property {(color|gradient|pattern)} value The color of the drawing. Default value is #000000<br />
      * A gradient object (linear or radial) used to fill the drawing (not supported by context2d)<br />
      * A pattern object to use to fill the drawing (not supported by context2d)
      */

      Object.defineProperty(this, 'fillStyle', {
        get: function get() {
          return this.ctx.fillStyle;
        },
        set: function set(value) {
          var rgba;
          rgba = getRGBA(value);
          this.ctx.fillStyle = rgba.style;
          this.ctx.isFillTransparent = rgba.a === 0;
          this.ctx.fillOpacity = rgba.a;
          this.pdf.setFillColor(rgba.r, rgba.g, rgba.b, {
            a: rgba.a
          });
          this.pdf.setTextColor(rgba.r, rgba.g, rgba.b, {
            a: rgba.a
          });
        }
      });
      /**
      * Sets or returns the color, gradient, or pattern used for strokes
      *
      * @name strokeStyle
      * @default #000000
      * @property {color} color A CSS color value that indicates the stroke color of the drawing. Default value is #000000 (not supported by context2d)
      * @property {gradient} gradient A gradient object (linear or radial) used to create a gradient stroke (not supported by context2d)
      * @property {pattern} pattern A pattern object used to create a pattern stroke (not supported by context2d)
      */

      Object.defineProperty(this, 'strokeStyle', {
        get: function get() {
          return this.ctx.strokeStyle;
        },
        set: function set(value) {
          var rgba = getRGBA(value);
          this.ctx.strokeStyle = rgba.style;
          this.ctx.isStrokeTransparent = rgba.a === 0;
          this.ctx.strokeOpacity = rgba.a;

          if (rgba.a === 0) {
            this.pdf.setDrawColor(255, 255, 255);
          } else if (rgba.a === 1) {
            this.pdf.setDrawColor(rgba.r, rgba.g, rgba.b);
          } else {
            this.pdf.setDrawColor(rgba.r, rgba.g, rgba.b);
          }
        }
      });
      /**
      * Sets or returns the style of the end caps for a line
      *
      * @name lineCap
      * @default butt
      * @property {(butt|round|square)} lineCap butt A flat edge is added to each end of the line <br/>
      * round A rounded end cap is added to each end of the line<br/>
      * square A square end cap is added to each end of the line<br/>
      */

      Object.defineProperty(this, 'lineCap', {
        get: function get() {
          return this.ctx.lineCap;
        },
        set: function set(value) {
          if (['butt', 'round', 'square'].indexOf(value) !== -1) {
            this.ctx.lineCap = value;
            this.pdf.setLineCap(value);
          }
        }
      });
      /**
      * Sets or returns the current line width
      *
      * @name lineWidth
      * @default 1
      * @property {number} lineWidth The current line width, in pixels
      */

      Object.defineProperty(this, 'lineWidth', {
        get: function get() {
          return this.ctx.lineWidth;
        },
        set: function set(value) {
          if (!isNaN(value)) {
            this.ctx.lineWidth = value;
            this.pdf.setLineWidth(value);
          }
        }
      });
      /**
      * Sets or returns the type of corner created, when two lines meet
      */

      Object.defineProperty(this, 'lineJoin', {
        get: function get() {
          return this.ctx.lineJoin;
        },
        set: function set(value) {
          if (['bevel', 'round', 'miter'].indexOf(value) !== -1) {
            this.ctx.lineJoin = value;
            this.pdf.setLineJoin(value);
          }
        }
      });
      /**
      * A number specifying the miter limit ratio in coordinate space units. Zero, negative, Infinity, and NaN values are ignored. The default value is 10.0.
      *
      * @name miterLimit
      * @default 10
      */

      Object.defineProperty(this, 'miterLimit', {
        get: function get() {
          return this.ctx.miterLimit;
        },
        set: function set(value) {
          if (!isNaN(value)) {
            this.ctx.miterLimit = value;
            this.pdf.setMiterLimit(value);
          }
        }
      });
      Object.defineProperty(this, 'textBaseline', {
        get: function get() {
          return this.ctx.textBaseline;
        },
        set: function set(value) {
          this.ctx.textBaseline = value;
        }
      });
      Object.defineProperty(this, 'textAlign', {
        get: function get() {
          return this.ctx.textAlign;
        },
        set: function set(value) {
          if (['right', 'end', 'center', 'left', 'start'].indexOf(value) !== -1) {
            this.ctx.textAlign = value;
          }
        }
      });
      Object.defineProperty(this, 'font', {
        get: function get() {
          return this.ctx.font;
        },
        set: function set(value) {
          this.ctx.font = value;
          var rx, matches; //source: https://stackoverflow.com/a/10136041

          rx = /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx]))(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-_,\"\'\sa-z]+?)\s*$/i;
          matches = rx.exec(value);

          if (matches !== null) {
            var fontStyle = matches[1];
            var fontVariant = matches[2];
            var fontWeight = matches[3];
            var fontSize = matches[4];
            var fontSizeUnit = matches[5];
            var fontFamily = matches[6];
          } else {
            return;
          }

          if ('px' === fontSizeUnit) {
            fontSize = Math.floor(parseFloat(fontSize));
          } else if ('em' === fontSizeUnit) {
            fontSize = Math.floor(parseFloat(fontSize) * this.pdf.getFontSize());
          } else {
            fontSize = Math.floor(parseFloat(fontSize));
          }

          this.pdf.setFontSize(fontSize);
          var style = '';

          if (fontWeight === 'bold' || parseInt(fontWeight, 10) >= 700 || fontStyle === 'bold') {
            style = 'bold';
          }

          if (fontStyle === 'italic') {
            style += 'italic';
          }

          if (style.length === 0) {
            style = 'normal';
          }

          var jsPdfFontName = '';
          var parts = fontFamily.toLowerCase().replace(/"|'/g, '').split(/\s*,\s*/);
          var fallbackFonts = {
            arial: 'Helvetica',
            verdana: 'Helvetica',
            helvetica: 'Helvetica',
            'sans-serif': 'Helvetica',
            fixed: 'Courier',
            monospace: 'Courier',
            terminal: 'Courier',
            courier: 'Courier',
            times: 'Times',
            cursive: 'Times',
            fantasy: 'Times',
            serif: 'Times'
          };

          for (var i = 0; i < parts.length; i++) {
            if (this.pdf.internal.getFont(parts[i], style, {
              noFallback: true,
              disableWarning: true
            }) !== undefined) {
              jsPdfFontName = parts[i];
              break;
            } else if (style === 'bolditalic' && this.pdf.internal.getFont(parts[i], 'bold', {
              noFallback: true,
              disableWarning: true
            }) !== undefined) {
              jsPdfFontName = parts[i];
              style = 'bold';
            } else if (this.pdf.internal.getFont(parts[i], 'normal', {
              noFallback: true,
              disableWarning: true
            }) !== undefined) {
              jsPdfFontName = parts[i];
              style = 'normal';
              break;
            }
          }

          if (jsPdfFontName === '') {
            for (var i = 0; i < parts.length; i++) {
              if (fallbackFonts[parts[i]]) {
                jsPdfFontName = fallbackFonts[parts[i]];
                break;
              }
            }
          }

          jsPdfFontName = jsPdfFontName === '' ? 'Times' : jsPdfFontName;
          this.pdf.setFont(jsPdfFontName, style);
        }
      });
      Object.defineProperty(this, 'globalCompositeOperation', {
        get: function get() {
          return this.ctx.globalCompositeOperation;
        },
        set: function set(value) {
          this.ctx.globalCompositeOperation = value;
        }
      });
      Object.defineProperty(this, 'globalAlpha', {
        get: function get() {
          return this.ctx.globalAlpha;
        },
        set: function set(value) {
          this.ctx.globalAlpha = value;
        }
      }); // Not HTML API

      Object.defineProperty(this, 'ignoreClearRect', {
        get: function get() {
          return this.ctx.ignoreClearRect;
        },
        set: function set(value) {
          this.ctx.ignoreClearRect = Boolean(value);
        }
      });
    };

    Context2D.prototype.fill = function () {
      pathPreProcess.call(this, 'fill', false);
    };
    /**
    * Actually draws the path you have defined
    *
    * @name stroke
    * @function
    * @description The stroke() method actually draws the path you have defined with all those moveTo() and lineTo() methods. The default color is black.
    */


    Context2D.prototype.stroke = function () {
      pathPreProcess.call(this, 'stroke', false);
    };
    /**
    * Begins a path, or resets the current 
    *
    * @name beginPath
    * @function 
    * @description The beginPath() method begins a path, or resets the current path.
    */


    Context2D.prototype.beginPath = function () {
      this.path = [{
        type: 'begin'
      }];
    };
    /**
    * Moves the path to the specified point in the canvas, without creating a line
    * 
    * @name moveTo
    * @function
    * @param x {Number} The x-coordinate of where to move the path to
    * @param y {Number} The y-coordinate of where to move the path to
    */


    Context2D.prototype.moveTo = function (x, y) {
      if (isNaN(x) || isNaN(y)) {
        console.error('jsPDF.context2d.moveTo: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.moveTo');
      }

      var pt = this.ctx.transform.applyToPoint(new Point(x, y));
      this.path.push({
        type: 'mt',
        x: pt.x,
        y: pt.y
      });
      this.ctx.lastPoint = new Point(x, y);
    };
    /**
    * Creates a path from the current point back to the starting point
    * 
    * @name closePath
    * @function
    * @description The closePath() method creates a path from the current point back to the starting point.
    */


    Context2D.prototype.closePath = function () {
      var pathBegin = new Point(0, 0);
      var i = 0;

      for (i = this.path.length - 1; i !== -1; i--) {
        if (this.path[i].type === 'begin') {
          if (_typeof(this.path[i + 1]) === 'object' && typeof this.path[i + 1].x === 'number') {
            pathBegin = new Point(this.path[i + 1].x, this.path[i + 1].y);
            this.path.push({
              type: 'lt',
              x: pathBegin.x,
              y: pathBegin.y
            });
            break;
          }
        }
      }

      if (_typeof(this.path[i + 2]) === 'object' && typeof this.path[i + 2].x === 'number') {
        this.path.push(JSON.parse(JSON.stringify(this.path[i + 2])));
      }

      this.path.push({
        type: 'close'
      });
      this.ctx.lastPoint = new Point(pathBegin.x, pathBegin.y);
    };
    /**
    * Adds a new point and creates a line to that point from the last specified point in the canvas
    * 
    * @name lineTo
    * @function
    * @param x The x-coordinate of where to create the line to
    * @param y The y-coordinate of where to create the line to
    * @description The lineTo() method adds a new point and creates a line TO that point FROM the last specified point in the canvas (this method does not draw the line).
    */


    Context2D.prototype.lineTo = function (x, y) {
      if (isNaN(x) || isNaN(y)) {
        console.error('jsPDF.context2d.lineTo: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.lineTo');
      }

      var pt = this.ctx.transform.applyToPoint(new Point(x, y));
      this.path.push({
        type: 'lt',
        x: pt.x,
        y: pt.y
      });
      this.ctx.lastPoint = new Point(pt.x, pt.y);
    };
    /**
    * Clips a region of any shape and size from the original canvas
    * 
    * @name clip
    * @function
    * @description The clip() method clips a region of any shape and size from the original canvas.
    */


    Context2D.prototype.clip = function () {
      this.ctx.clip_path = JSON.parse(JSON.stringify(this.path));
      pathPreProcess.call(this, null, true);
    };
    /**
    * Creates a cubic Bézier curve
    *
    * @name quadraticCurveTo
    * @function
    * @param cpx {Number} The x-coordinate of the Bézier control point
    * @param cpy {Number} The y-coordinate of the Bézier control point
    * @param x {Number} The x-coordinate of the ending point
    * @param y {Number} The y-coordinate of the ending point
    * @description The quadraticCurveTo() method adds a point to the current path by using the specified control points that represent a quadratic Bézier curve.<br /><br /> A quadratic Bézier curve requires two points. The first point is a control point that is used in the quadratic Bézier calculation and the second point is the ending point for the curve. The starting point for the curve is the last point in the current path. If a path does not exist, use the beginPath() and moveTo() methods to define a starting point.
    */


    Context2D.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
      if (isNaN(x) || isNaN(y) || isNaN(cpx) || isNaN(cpy)) {
        console.error('jsPDF.context2d.quadraticCurveTo: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.quadraticCurveTo');
      }

      var pt0 = this.ctx.transform.applyToPoint(new Point(x, y));
      var pt1 = this.ctx.transform.applyToPoint(new Point(cpx, cpy));
      this.path.push({
        type: 'qct',
        x1: pt1.x,
        y1: pt1.y,
        x: pt0.x,
        y: pt0.y
      });
      this.ctx.lastPoint = new Point(pt0.x, pt0.y);
    };
    /**
    * Creates a cubic Bézier curve
    *
    * @name bezierCurveTo
    * @function
    * @param cp1x {Number} The x-coordinate of the first Bézier control point
    * @param cp1y {Number} The y-coordinate of the first Bézier control point
    * @param cp2x {Number} The x-coordinate of the second Bézier control point
    * @param cp2y {Number} The y-coordinate of the second Bézier control point
    * @param x {Number} The x-coordinate of the ending point
    * @param y {Number} The y-coordinate of the ending point
    * @description The bezierCurveTo() method adds a point to the current path by using the specified control points that represent a cubic Bézier curve. <br /><br />A cubic bezier curve requires three points. The first two points are control points that are used in the cubic Bézier calculation and the last point is the ending point for the curve.  The starting point for the curve is the last point in the current path. If a path does not exist, use the beginPath() and moveTo() methods to define a starting point.
    */


    Context2D.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
      if (isNaN(x) || isNaN(y) || isNaN(cp1x) || isNaN(cp1y) || isNaN(cp2x) || isNaN(cp2y)) {
        console.error('jsPDF.context2d.bezierCurveTo: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.bezierCurveTo');
      }

      var pt0 = this.ctx.transform.applyToPoint(new Point(x, y));
      var pt1 = this.ctx.transform.applyToPoint(new Point(cp1x, cp1y));
      var pt2 = this.ctx.transform.applyToPoint(new Point(cp2x, cp2y));
      this.path.push({
        type: 'bct',
        x1: pt1.x,
        y1: pt1.y,
        x2: pt2.x,
        y2: pt2.y,
        x: pt0.x,
        y: pt0.y
      });
      this.ctx.lastPoint = new Point(pt0.x, pt0.y);
    };
    /**
    * Creates an arc/curve (used to create circles, or parts of circles)
    *
    * @name arc
    * @function
    * @param x {Number} The x-coordinate of the center of the circle
    * @param y {Number} The y-coordinate of the center of the circle
    * @param radius {Number} The radius of the circle
    * @param startAngle {Number} The starting angle, in radians (0 is at the 3 o'clock position of the arc's circle)
    * @param endAngle {Number} The ending angle, in radians
    * @param counterclockwise {Boolean} Optional. Specifies whether the drawing should be counterclockwise or clockwise. False is default, and indicates clockwise, while true indicates counter-clockwise.
    * @description The arc() method creates an arc/curve (used to create circles, or parts of circles).
    */


    Context2D.prototype.arc = function (x, y, radius, startAngle, endAngle, counterclockwise) {
      if (isNaN(x) || isNaN(y) || isNaN(radius) || isNaN(startAngle) || isNaN(endAngle)) {
        console.error('jsPDF.context2d.arc: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.arc');
      }

      counterclockwise = Boolean(counterclockwise);

      if (!this.ctx.transform.isIdentity) {
        var xpt = this.ctx.transform.applyToPoint(new Point(x, y));
        x = xpt.x;
        y = xpt.y;
        var x_radPt = this.ctx.transform.applyToPoint(new Point(0, radius));
        var x_radPt0 = this.ctx.transform.applyToPoint(new Point(0, 0));
        radius = Math.sqrt(Math.pow(x_radPt.x - x_radPt0.x, 2) + Math.pow(x_radPt.y - x_radPt0.y, 2));
      }

      if (Math.abs(endAngle - startAngle) >= 2 * Math.PI) {
        startAngle = 0;
        endAngle = 2 * Math.PI;
      }

      this.path.push({
        type: 'arc',
        x: x,
        y: y,
        radius: radius,
        startAngle: startAngle,
        endAngle: endAngle,
        counterclockwise: counterclockwise
      }); // this.ctx.lastPoint(new Point(pt.x,pt.y));
    };
    /**
    * Creates an arc/curve between two tangents
    * 
    * @name arcTo
    * @function
    * @param x1 {Number} The x-coordinate of the first tangent
    * @param y1 {Number} The y-coordinate of the first tangent
    * @param x2 {Number} The x-coordinate of the second tangent
    * @param y2 {Number} The y-coordinate of the second tangent
    * @param radius The radius of the arc
    * @description The arcTo() method creates an arc/curve between two tangents on the canvas.
    */


    Context2D.prototype.arcTo = function (x1, y1, x2, y2, radius) {
      throw new Error('arcTo not implemented.');
    };
    /**
    * Creates a rectangle
    *
    * @name rect
    * @function
    * @param x {Number} The x-coordinate of the upper-left corner of the rectangle
    * @param y {Number} The y-coordinate of the upper-left corner of the rectangle
    * @param w {Number} The width of the rectangle, in pixels
    * @param h {Number} The height of the rectangle, in pixels
    * @description The rect() method creates a rectangle.
    */


    Context2D.prototype.rect = function (x, y, w, h) {
      if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
        console.error('jsPDF.context2d.rect: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.rect');
      }

      this.moveTo(x, y);
      this.lineTo(x + w, y);
      this.lineTo(x + w, y + h);
      this.lineTo(x, y + h);
      this.lineTo(x, y);
      this.lineTo(x + w, y);
      this.lineTo(x, y);
    };
    /**
    * Draws a "filled" rectangle
    *
    * @name fillRect
    * @function
    * @param x {Number} The x-coordinate of the upper-left corner of the rectangle
    * @param y {Number} The y-coordinate of the upper-left corner of the rectangle
    * @param w {Number} The width of the rectangle, in pixels
    * @param h {Number} The height of the rectangle, in pixels
    * @description The fillRect() method draws a "filled" rectangle. The default color of the fill is black.
    */


    Context2D.prototype.fillRect = function (x, y, w, h) {
      if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
        console.error('jsPDF.context2d.fillRect: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.fillRect');
      }

      if (isFillTransparent.call(this)) {
        return;
      }

      var tmp = {};

      if (this.lineCap !== 'butt') {
        tmp.lineCap = this.lineCap;
        this.lineCap = 'butt';
      }

      if (this.lineJoin !== 'miter') {
        tmp.lineJoin = this.lineJoin;
        this.lineJoin = 'miter';
      }

      this.beginPath();
      this.rect(x, y, w, h);
      this.fill();

      if (tmp.hasOwnProperty('lineCap')) {
        this.lineCap = tmp.lineCap;
      }

      if (tmp.hasOwnProperty('lineJoin')) {
        this.lineJoin = tmp.lineJoin;
      }
    };
    /**
    *     Draws a rectangle (no fill)
    *
    * @name strokeRect
    * @function
    * @param x {Number} The x-coordinate of the upper-left corner of the rectangle
    * @param y {Number} The y-coordinate of the upper-left corner of the rectangle
    * @param w {Number} The width of the rectangle, in pixels
    * @param h {Number} The height of the rectangle, in pixels
    * @description The strokeRect() method draws a rectangle (no fill). The default color of the stroke is black.
    */


    Context2D.prototype.strokeRect = function strokeRect(x, y, w, h) {
      if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
        console.error('jsPDF.context2d.strokeRect: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.strokeRect');
      }

      if (isStrokeTransparent.call(this)) {
        return;
      }

      this.beginPath();
      this.rect(x, y, w, h);
      this.stroke();
    };
    /**
    * Clears the specified pixels within a given rectangle
    *
    * @name clearRect
    * @function
    * @param x {Number} The x-coordinate of the upper-left corner of the rectangle
    * @param y {Number} The y-coordinate of the upper-left corner of the rectangle
    * @param w {Number} The width of the rectangle to clear, in pixels
    * @param h {Number} The height of the rectangle to clear, in pixels
    * @description We cannot clear PDF commands that were already written to PDF, so we use white instead. <br />
    * As a special case, read a special flag (ignoreClearRect) and do nothing if it is set.
    * This results in all calls to clearRect() to do nothing, and keep the canvas transparent.
    * This flag is stored in the save/restore context and is managed the same way as other drawing states.
    *
    */


    Context2D.prototype.clearRect = function (x, y, w, h) {
      if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
        console.error('jsPDF.context2d.clearRect: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.clearRect');
      }

      if (this.ignoreClearRect) {
        return;
      }

      this.fillStyle = '#ffffff';
      this.fillRect(x, y, w, h);
    };
    /**
    * Saves the state of the current context
    * 
    * @name save
    * @function
    */


    Context2D.prototype.save = function (doStackPush) {
      doStackPush = typeof doStackPush === 'boolean' ? doStackPush : true;
      var tmpPageNumber = this.pdf.internal.getCurrentPageInfo().pageNumber;

      for (var i = 0; i < this.pdf.internal.getNumberOfPages(); i++) {
        this.pdf.setPage(i + 1);
        this.pdf.internal.out('q');
      }

      this.pdf.setPage(tmpPageNumber);

      if (doStackPush) {
        this.ctx.fontSize = this.pdf.internal.getFontSize();
        var ctx = new ContextLayer(this.ctx);
        this.ctxStack.push(this.ctx);
        this.ctx = ctx;
      }
    };
    /**
    * Returns previously saved path state and attributes
    * 
    * @name restore
    * @function
    */


    Context2D.prototype.restore = function (doStackPop) {
      doStackPop = typeof doStackPop === 'boolean' ? doStackPop : true;
      var tmpPageNumber = this.pdf.internal.getCurrentPageInfo().pageNumber;

      for (var i = 0; i < this.pdf.internal.getNumberOfPages(); i++) {
        this.pdf.setPage(i + 1);
        this.pdf.internal.out('Q');
      }

      this.pdf.setPage(tmpPageNumber);

      if (doStackPop && this.ctxStack.length !== 0) {
        this.ctx = this.ctxStack.pop();
        this.fillStyle = this.ctx.fillStyle;
        this.strokeStyle = this.ctx.strokeStyle;
        this.font = this.ctx.font;
        this.lineCap = this.ctx.lineCap;
        this.lineWidth = this.ctx.lineWidth;
        this.lineJoin = this.ctx.lineJoin;
      }
    };
    /** 
    * @name toDataURL
    * @function
    */


    Context2D.prototype.toDataURL = function () {
      throw new Error('toDataUrl not implemented.');
    }; //helper functions

    /**
    * Get the decimal values of r, g, b and a
    *
    * @name getRGBA
    * @function
    * @private
    * @ignore
    */


    var getRGBA = function getRGBA(style) {
      var rxRgb = /rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
      var rxRgba = /rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d\.]+)\s*\)/;
      var rxTransparent = /transparent|rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*0+\s*\)/;
      var r, g, b, a;

      if (style.isCanvasGradient === true) {
        style = style.getColor();
      }

      if (!style) {
        return {
          r: 0,
          g: 0,
          b: 0,
          a: 0,
          style: style
        };
      }

      if (rxTransparent.test(style)) {
        r = 0;
        g = 0;
        b = 0;
        a = 0;
      } else {
        var matches = rxRgb.exec(style);

        if (matches !== null) {
          r = parseInt(matches[1]);
          g = parseInt(matches[2]);
          b = parseInt(matches[3]);
          a = 1;
        } else {
          matches = rxRgba.exec(style);

          if (matches !== null) {
            r = parseInt(matches[1]);
            g = parseInt(matches[2]);
            b = parseInt(matches[3]);
            a = parseFloat(matches[4]);
          } else {
            a = 1;

            if (typeof style === "string" && style.charAt(0) !== '#') {
              var rgbColor = new RGBColor(style);

              if (rgbColor.ok) {
                style = rgbColor.toHex();
              } else {
                style = '#000000';
              }
            }

            if (style.length === 4) {
              r = style.substring(1, 2);
              r += r;
              g = style.substring(2, 3);
              g += g;
              b = style.substring(3, 4);
              b += b;
            } else {
              r = style.substring(1, 3);
              g = style.substring(3, 5);
              b = style.substring(5, 7);
            }

            r = parseInt(r, 16);
            g = parseInt(g, 16);
            b = parseInt(b, 16);
          }
        }
      }

      return {
        r: r,
        g: g,
        b: b,
        a: a,
        style: style
      };
    };
    /**
    * @name isFillTransparent
    * @function 
    * @private
    * @ignore
    * @returns {Boolean}
    */


    var isFillTransparent = function isFillTransparent() {
      return this.ctx.isFillTransparent || this.globalAlpha == 0;
    };
    /**
    * @name isStrokeTransparent
    * @function 
    * @private
    * @ignore
    * @returns {Boolean}
    */


    var isStrokeTransparent = function isStrokeTransparent() {
      return Boolean(this.ctx.isStrokeTransparent || this.globalAlpha == 0);
    };
    /**
    * Draws "filled" text on the canvas
    * 
    * @name fillText
    * @function
    * @param text {String} Specifies the text that will be written on the canvas
    * @param x {Number} The x coordinate where to start painting the text (relative to the canvas)
    * @param y {Number} The y coordinate where to start painting the text (relative to the canvas)
    * @param maxWidth {Number} Optional. The maximum allowed width of the text, in pixels
    * @description The fillText() method draws filled text on the canvas. The default color of the text is black.
    */


    Context2D.prototype.fillText = function (text, x, y, maxWidth) {
      if (isNaN(x) || isNaN(y) || typeof text !== 'string') {
        console.error('jsPDF.context2d.fillText: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.fillText');
      }

      maxWidth = isNaN(maxWidth) ? undefined : maxWidth;

      if (isFillTransparent.call(this)) {
        return;
      }

      y = getBaseline.call(this, y);
      var degs = rad2deg(this.ctx.transform.rotation); // We only use X axis as scale hint 

      var scale = this.ctx.transform.scaleX;
      putText.call(this, {
        text: text,
        x: x,
        y: y,
        scale: scale,
        angle: degs,
        align: this.textAlign,
        maxWidth: maxWidth
      });
    };
    /**
    * Draws text on the canvas (no fill)
    * 
    * @name strokeText
    * @function
    * @param text {String} Specifies the text that will be written on the canvas
    * @param x {Number} The x coordinate where to start painting the text (relative to the canvas)
    * @param y {Number} The y coordinate where to start painting the text (relative to the canvas)
    * @param maxWidth {Number} Optional. The maximum allowed width of the text, in pixels
    * @description The strokeText() method draws text (with no fill) on the canvas. The default color of the text is black.
    */


    Context2D.prototype.strokeText = function (text, x, y, maxWidth) {
      if (isNaN(x) || isNaN(y) || typeof text !== 'string') {
        console.error('jsPDF.context2d.strokeText: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.strokeText');
      }

      if (isStrokeTransparent.call(this)) {
        return;
      }

      maxWidth = isNaN(maxWidth) ? undefined : maxWidth;
      y = getBaseline.call(this, y);
      var degs = rad2deg(this.ctx.transform.rotation);
      var scale = this.ctx.transform.scaleX;
      putText.call(this, {
        text: text,
        x: x,
        y: y,
        scale: scale,
        renderingMode: 'stroke',
        angle: degs,
        align: this.textAlign,
        maxWidth: maxWidth
      });
    };
    /**
    * Returns an object that contains the width of the specified text
    *
    * @name measureText
    * @function 
    * @param text {String} The text to be measured
    * @description The measureText() method returns an object that contains the width of the specified text, in pixels.
    * @returns {Number}
    */


    Context2D.prototype.measureText = function (text) {
      if (typeof text !== 'string') {
        console.error('jsPDF.context2d.measureText: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.measureText');
      }

      var pdf = this.pdf;
      var k = this.pdf.internal.scaleFactor;
      var fontSize = pdf.internal.getFontSize();
      var txtWidth = pdf.getStringUnitWidth(text) * fontSize / pdf.internal.scaleFactor;
      txtWidth *= Math.round(k * 96 / 72 * 10000) / 10000;

      var TextMetrics = function TextMetrics(options) {
        options = options || {};

        var _width = options.width || 0;

        Object.defineProperty(this, 'width', {
          get: function get() {
            return _width;
          }
        });
        return this;
      };

      return new TextMetrics({
        width: txtWidth
      });
    }; //Transformations

    /**
    * Scales the current drawing bigger or smaller
    * 
    * @name scale 
    * @function
    * @param scalewidth {Number} Scales the width of the current drawing (1=100%, 0.5=50%, 2=200%, etc.)
    * @param scaleheight {Number} Scales the height of the current drawing (1=100%, 0.5=50%, 2=200%, etc.)
    * @description The scale() method scales the current drawing, bigger or smaller.
    */


    Context2D.prototype.scale = function (scalewidth, scaleheight) {
      if (isNaN(scalewidth) || isNaN(scaleheight)) {
        console.error('jsPDF.context2d.scale: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.scale');
      }

      var matrix = new Matrix(scalewidth, 0.0, 0.0, scaleheight, 0.0, 0.0);
      this.ctx.transform = this.ctx.transform.multiply(matrix);
    };
    /**
    * Rotates the current drawing
    * 
    * @name rotate
    * @function
    * @param angle {Number} The rotation angle, in radians.
    * @description To calculate from degrees to radians: degrees*Math.PI/180. <br />
    * Example: to rotate 5 degrees, specify the following: 5*Math.PI/180
    */


    Context2D.prototype.rotate = function (angle) {
      if (isNaN(angle)) {
        console.error('jsPDF.context2d.rotate: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.rotate');
      }

      var matrix = new Matrix(Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0.0, 0.0);
      this.ctx.transform = this.ctx.transform.multiply(matrix);
    };
    /**
    * Remaps the (0,0) position on the canvas
    * 
    * @name translate
    * @function
    * @param x {Number} The value to add to horizontal (x) coordinates
    * @param y {Number} The value to add to vertical (y) coordinates
    * @description The translate() method remaps the (0,0) position on the canvas.
    */


    Context2D.prototype.translate = function (x, y) {
      if (isNaN(x) || isNaN(y)) {
        console.error('jsPDF.context2d.translate: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.translate');
      }

      var matrix = new Matrix(1.0, 0.0, 0.0, 1.0, x, y);
      this.ctx.transform = this.ctx.transform.multiply(matrix);
    };
    /**
    * Replaces the current transformation matrix for the drawing
    * 
    * @name transform
    * @function
    * @param a {Number} Horizontal scaling
    * @param b {Number} Horizontal skewing
    * @param c {Number} Vertical skewing
    * @param d {Number} Vertical scaling
    * @param e {Number} Horizontal moving
    * @param f {Number} Vertical moving
    * @description Each object on the canvas has a current transformation matrix.<br /><br />The transform() method replaces the current transformation matrix. It multiplies the current transformation matrix with the matrix described by:<br /><br /><br /><br />a    c    e<br /><br />b    d    f<br /><br />0    0    1<br /><br />In other words, the transform() method lets you scale, rotate, move, and skew the current context.
    */


    Context2D.prototype.transform = function (a, b, c, d, e, f) {
      if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d) || isNaN(e) || isNaN(f)) {
        console.error('jsPDF.context2d.transform: Invalid arguments', arguments);
        throw new Error('Invalid arguments passed to jsPDF.context2d.transform');
      }

      var matrix = new Matrix(a, b, c, d, e, f);
      this.ctx.transform = this.ctx.transform.multiply(matrix);
    };
    /**
    * Resets the current transform to the identity matrix. Then runs transform()
    * 
    * @name setTransform
    * @function
    * @param a {Number} Horizontal scaling
    * @param b {Number} Horizontal skewing
    * @param c {Number} Vertical skewing
    * @param d {Number} Vertical scaling
    * @param e {Number} Horizontal moving
    * @param f {Number} Vertical moving
    * @description Each object on the canvas has a current transformation matrix. <br /><br />The setTransform() method resets the current transform to the identity matrix, and then runs transform() with the same arguments.<br /><br />In other words, the setTransform() method lets you scale, rotate, move, and skew the current context.
    */


    Context2D.prototype.setTransform = function (a, b, c, d, e, f) {
      a = isNaN(a) ? 1 : a;
      b = isNaN(b) ? 0 : b;
      c = isNaN(c) ? 0 : c;
      d = isNaN(d) ? 1 : d;
      e = isNaN(e) ? 0 : e;
      f = isNaN(f) ? 0 : f;
      this.ctx.transform = new Matrix(a, b, c, d, e, f);
    };
    /**
    * Draws an image, canvas, or video onto the canvas
    * 
    * @function 
    * @param img {} Specifies the image, canvas, or video element to use
    * @param sx {Number} Optional. The x coordinate where to start clipping
    * @param sy {Number} Optional. The y coordinate where to start clipping
    * @param swidth {Number} Optional. The width of the clipped image
    * @param sheight {Number} Optional. The height of the clipped image
    * @param x {Number} The x coordinate where to place the image on the canvas
    * @param y {Number} The y coordinate where to place the image on the canvas
    * @param width {Number} Optional. The width of the image to use (stretch or reduce the image)
    * @param height {Number} Optional. The height of the image to use (stretch or reduce the image)
    */


    Context2D.prototype.drawImage = function (img, sx, sy, swidth, sheight, x, y, width, height) {
      var imageProperties = this.pdf.getImageProperties(img);
      var factorX = 1;
      var factorY = 1;
      var clipFactorX = 1;
      var clipFactorY = 1;
      var scaleFactorX = 1;

      if (typeof swidth !== 'undefined' && typeof width !== 'undefined') {
        clipFactorX = width / swidth;
        clipFactorY = height / sheight;
        factorX = imageProperties.width / swidth * width / swidth;
        factorY = imageProperties.height / sheight * height / sheight;
      } //is sx and sy are set and x and y not, set x and y with values of sx and sy


      if (typeof x === 'undefined') {
        x = sx;
        y = sy;
        sx = 0;
        sy = 0;
      }

      if (typeof swidth !== 'undefined' && typeof width === 'undefined') {
        width = swidth;
        height = sheight;
      }

      if (typeof swidth === 'undefined' && typeof width === 'undefined') {
        width = imageProperties.width;
        height = imageProperties.height;
      }

      var decomposedTransformationMatrix = this.ctx.transform.decompose();
      var angle = rad2deg(decomposedTransformationMatrix.rotate.shx);
      scaleFactorX = decomposedTransformationMatrix.scale.sx;
      scaleFactorX = decomposedTransformationMatrix.scale.sy;
      var matrix = new Matrix();
      matrix = matrix.multiply(decomposedTransformationMatrix.translate);
      matrix = matrix.multiply(decomposedTransformationMatrix.skew);
      matrix = matrix.multiply(decomposedTransformationMatrix.scale);
      var mP = matrix.applyToPoint(new Point(width, height));
      var xRect = matrix.applyToRectangle(new Rectangle(x - sx * clipFactorX, y - sy * clipFactorY, swidth * factorX, sheight * factorY));
      var pageArray = getPagesByPath.call(this, xRect);
      var pages = [];

      for (var ii = 0; ii < pageArray.length; ii += 1) {
        if (pages.indexOf(pageArray[ii]) === -1) {
          pages.push(pageArray[ii]);
        }
      }

      pages.sort();
      var clipPath;

      if (this.autoPaging) {
        var min = pages[0];
        var max = pages[pages.length - 1];

        for (var i = min; i < max + 1; i++) {
          this.pdf.setPage(i);

          if (this.ctx.clip_path.length !== 0) {
            var tmpPaths = this.path;
            clipPath = JSON.parse(JSON.stringify(this.ctx.clip_path));
            this.path = pathPositionRedo(clipPath, this.posX, -1 * this.pdf.internal.pageSize.height * (i - 1) + this.posY);
            drawPaths.call(this, 'fill', true);
            this.path = tmpPaths;
          }

          var tmpRect = JSON.parse(JSON.stringify(xRect));
          tmpRect = pathPositionRedo([tmpRect], this.posX, -1 * this.pdf.internal.pageSize.height * (i - 1) + this.posY)[0];
          this.pdf.addImage(img, 'jpg', tmpRect.x, tmpRect.y, tmpRect.w, tmpRect.h, null, null, angle);
        }
      } else {
        this.pdf.addImage(img, 'jpg', xRect.x, xRect.y, xRect.w, xRect.h, null, null, angle);
      }
    };

    var getPagesByPath = function getPagesByPath(path, pageWrapX, pageWrapY) {
      var result = [];
      pageWrapX = pageWrapX || this.pdf.internal.pageSize.width;
      pageWrapY = pageWrapY || this.pdf.internal.pageSize.height;

      switch (path.type) {
        default:
        case 'mt':
        case 'lt':
          result.push(Math.floor((path.y + this.posY) / pageWrapY) + 1);
          break;

        case 'arc':
          result.push(Math.floor((path.y + this.posY - path.radius) / pageWrapY) + 1);
          result.push(Math.floor((path.y + this.posY + path.radius) / pageWrapY) + 1);
          break;

        case 'qct':
          var rectOfQuadraticCurve = getQuadraticCurveBoundary(this.ctx.lastPoint.x, this.ctx.lastPoint.y, path.x1, path.y1, path.x, path.y);
          result.push(Math.floor(rectOfQuadraticCurve.y / pageWrapY) + 1);
          result.push(Math.floor((rectOfQuadraticCurve.y + rectOfQuadraticCurve.h) / pageWrapY) + 1);
          break;

        case 'bct':
          var rectOfBezierCurve = getBezierCurveBoundary(this.ctx.lastPoint.x, this.ctx.lastPoint.y, path.x1, path.y1, path.x2, path.y2, path.x, path.y);
          result.push(Math.floor(rectOfBezierCurve.y / pageWrapY) + 1);
          result.push(Math.floor((rectOfBezierCurve.y + rectOfBezierCurve.h) / pageWrapY) + 1);
          break;

        case 'rect':
          result.push(Math.floor((path.y + this.posY) / pageWrapY) + 1);
          result.push(Math.floor((path.y + path.h + this.posY) / pageWrapY) + 1);
      }

      for (var i = 0; i < result.length; i += 1) {
        while (this.pdf.internal.getNumberOfPages() < result[i]) {
          addPage.call(this);
        }
      }

      return result;
    };

    var addPage = function addPage() {
      var fillStyle = this.fillStyle;
      var strokeStyle = this.strokeStyle;
      var font = this.font;
      var lineCap = this.lineCap;
      var lineWidth = this.lineWidth;
      var lineJoin = this.lineJoin;
      this.pdf.addPage();
      this.fillStyle = fillStyle;
      this.strokeStyle = strokeStyle;
      this.font = font;
      this.lineCap = lineCap;
      this.lineWidth = lineWidth;
      this.lineJoin = lineJoin;
    };

    var pathPositionRedo = function pathPositionRedo(paths, x, y) {
      for (var i = 0; i < paths.length; i++) {
        switch (paths[i].type) {
          case 'bct':
            paths[i].x2 += x;
            paths[i].y2 += y;

          case 'qct':
            paths[i].x1 += x;
            paths[i].y1 += y;

          case 'mt':
          case 'lt':
          case 'arc':
          default:
            paths[i].x += x;
            paths[i].y += y;
        }
      }

      return paths;
    };

    var pathPreProcess = function pathPreProcess(rule, isClip) {
      var fillStyle = this.fillStyle;
      var strokeStyle = this.strokeStyle;
      var font = this.font;
      var lineCap = this.lineCap;
      var lineWidth = this.lineWidth;
      var lineJoin = this.lineJoin;
      var origPath = JSON.parse(JSON.stringify(this.path));
      var xPath = JSON.parse(JSON.stringify(this.path));
      var clipPath;
      var tmpPath;
      var pages = [];

      for (var i = 0; i < xPath.length; i++) {
        if (typeof xPath[i].x !== "undefined") {
          var page = getPagesByPath.call(this, xPath[i]);

          for (var ii = 0; ii < page.length; ii += 1) {
            if (pages.indexOf(page[ii]) === -1) {
              pages.push(page[ii]);
            }
          }
        }
      }

      for (var i = 0; i < pages.length; i++) {
        while (this.pdf.internal.getNumberOfPages() < pages[i]) {
          addPage.call(this);
        }
      }

      pages.sort();

      if (this.autoPaging) {
        var min = pages[0];
        var max = pages[pages.length - 1];

        for (var i = min; i < max + 1; i++) {
          this.pdf.setPage(i);
          this.fillStyle = fillStyle;
          this.strokeStyle = strokeStyle;
          this.lineCap = lineCap;
          this.lineWidth = lineWidth;
          this.lineJoin = lineJoin;

          if (this.ctx.clip_path.length !== 0) {
            var tmpPaths = this.path;
            clipPath = JSON.parse(JSON.stringify(this.ctx.clip_path));
            this.path = pathPositionRedo(clipPath, this.posX, -1 * this.pdf.internal.pageSize.height * (i - 1) + this.posY);
            drawPaths.call(this, rule, true);
            this.path = tmpPaths;
          }

          tmpPath = JSON.parse(JSON.stringify(origPath));
          this.path = pathPositionRedo(tmpPath, this.posX, -1 * this.pdf.internal.pageSize.height * (i - 1) + this.posY);

          if (isClip === false || i === 0) {
            drawPaths.call(this, rule, isClip);
          }
        }
      } else {
        drawPaths.call(this, rule, isClip);
      }

      this.path = origPath;
    };
    /**
    * Processes the paths
    *
    * @function 
    * @param rule {String}
    * @param isClip {Boolean}
    * @private
    * @ignore
    */


    var drawPaths = function drawPaths(rule, isClip) {
      if (rule === 'stroke' && !isClip && isStrokeTransparent.call(this)) {
        return;
      }

      if (rule !== 'stroke' && !isClip && isFillTransparent.call(this)) {
        return;
      }

      var moves = [];
      var alpha = this.ctx.globalAlpha;

      if (this.ctx.fillOpacity < 1) {
        alpha = this.ctx.fillOpacity;
      }

      var xPath = this.path;

      for (var i = 0; i < xPath.length; i++) {
        var pt = xPath[i];

        switch (pt.type) {
          case 'begin':
            moves.push({
              begin: true
            });
            break;

          case 'close':
            moves.push({
              close: true
            });
            break;

          case 'mt':
            moves.push({
              start: pt,
              deltas: [],
              abs: []
            });
            break;

          case 'lt':
            var iii = moves.length;

            if (!isNaN(xPath[i - 1].x)) {
              var delta = [pt.x - xPath[i - 1].x, pt.y - xPath[i - 1].y];

              if (iii > 0) {
                for (iii; iii >= 0; iii--) {
                  if (moves[iii - 1].close !== true && moves[iii - 1].begin !== true) {
                    moves[iii - 1].deltas.push(delta);
                    moves[iii - 1].abs.push(pt);
                    break;
                  }
                }
              }
            }

            break;

          case 'bct':
            var delta = [pt.x1 - xPath[i - 1].x, pt.y1 - xPath[i - 1].y, pt.x2 - xPath[i - 1].x, pt.y2 - xPath[i - 1].y, pt.x - xPath[i - 1].x, pt.y - xPath[i - 1].y];
            moves[moves.length - 1].deltas.push(delta);
            break;

          case 'qct':
            var x1 = xPath[i - 1].x + 2.0 / 3.0 * (pt.x1 - xPath[i - 1].x);
            var y1 = xPath[i - 1].y + 2.0 / 3.0 * (pt.y1 - xPath[i - 1].y);
            var x2 = pt.x + 2.0 / 3.0 * (pt.x1 - pt.x);
            var y2 = pt.y + 2.0 / 3.0 * (pt.y1 - pt.y);
            var x3 = pt.x;
            var y3 = pt.y;
            var delta = [x1 - xPath[i - 1].x, y1 - xPath[i - 1].y, x2 - xPath[i - 1].x, y2 - xPath[i - 1].y, x3 - xPath[i - 1].x, y3 - xPath[i - 1].y];
            moves[moves.length - 1].deltas.push(delta);
            break;

          case 'arc':
            moves.push({
              deltas: [],
              abs: [],
              arc: true
            });

            if (Array.isArray(moves[moves.length - 1].abs)) {
              moves[moves.length - 1].abs.push(pt);
            }

            break;
        }
      }

      var style;

      if (!isClip) {
        if (rule === 'stroke') {
          style = 'stroke';
        } else {
          style = 'fill';
        }
      } else {
        style = null;
      }

      for (var i = 0; i < moves.length; i++) {
        if (moves[i].arc) {
          var arcs = moves[i].abs;

          for (var ii = 0; ii < arcs.length; ii++) {
            var arc = arcs[ii];

            if (typeof arc.startAngle !== 'undefined') {
              var start = rad2deg(arc.startAngle);
              var end = rad2deg(arc.endAngle);
              var x = arc.x;
              var y = arc.y;
              drawArc.call(this, x, y, arc.radius, start, end, arc.counterclockwise, style, isClip);
            } else {
              drawLine.call(this, arc.x, arc.y);
            }
          }
        }

        if (!moves[i].arc) {
          if (moves[i].close !== true && moves[i].begin !== true) {
            var x = moves[i].start.x;
            var y = moves[i].start.y;
            drawLines.call(this, moves[i].deltas, x, y, null, null);
          }
        }
      }

      if (style) {
        putStyle.call(this, style);
      }

      if (isClip) {
        doClip.call(this);
      }
    };

    var getBaseline = function getBaseline(y) {
      var height = this.pdf.internal.getFontSize() / this.pdf.internal.scaleFactor;
      var descent = height * (this.pdf.internal.getLineHeightFactor() - 1);

      switch (this.ctx.textBaseline) {
        case 'bottom':
          return y - descent;

        case 'top':
          return y + height - descent;

        case 'hanging':
          return y + height - 2 * descent;

        case 'middle':
          return y + height / 2 - descent;

        case 'ideographic':
          // TODO not implemented
          return y;

        case 'alphabetic':
        default:
          return y;
      }
    };

    Context2D.prototype.createLinearGradient = function createLinearGradient() {
      var canvasGradient = function canvasGradient() {};

      canvasGradient.colorStops = [];

      canvasGradient.addColorStop = function (offset, color) {
        this.colorStops.push([offset, color]);
      };

      canvasGradient.getColor = function () {
        if (this.colorStops.length === 0) {
          return '#000000';
        }

        return this.colorStops[0][1];
      };

      canvasGradient.isCanvasGradient = true;
      return canvasGradient;
    };

    Context2D.prototype.createPattern = function createPattern() {
      return this.createLinearGradient();
    };

    Context2D.prototype.createRadialGradient = function createRadialGradient() {
      return this.createLinearGradient();
    };
    /**
    *
    * @param x Edge point X
    * @param y Edge point Y
    * @param r Radius
    * @param a1 start angle
    * @param a2 end angle
    * @param counterclockwise
    * @param style
    * @param isClip
    */


    var drawArc = function drawArc(x, y, r, a1, a2, counterclockwise, style, isClip) {
      var k = this.pdf.internal.scaleFactor;
      var a1r = deg2rad(a1);
      var a2r = deg2rad(a2);
      var curves = createArc.call(this, r, a1r, a2r, counterclockwise);

      for (var i = 0; i < curves.length; i++) {
        var curve = curves[i];

        if (i === 0) {
          doMove.call(this, curve.x1 + x, curve.y1 + y);
        }
        drawCurve.call(this, x, y, curve.x2, curve.y2, curve.x3, curve.y3, curve.x4, curve.y4);
      }

      if (!isClip) {
        putStyle.call(this, style);
      } else {
        doClip.call(this);
      }
    };

    var putStyle = function putStyle(style) {
      switch (style) {
        case 'stroke':
          this.pdf.internal.out('S');
          break;

        case 'fill':
          this.pdf.internal.out('f');
          break;
      }
    };

    var doClip = function doClip() {
      this.pdf.clip();
    };

    var doMove = function doMove(x, y) {
      this.pdf.internal.out(getHorizontalCoordinateString(x) + ' ' + getVerticalCoordinateString(y) + ' m');
    };

    var putText = function putText(options) {
      var textAlign;

      switch (options.align) {
        case 'right':
        case 'end':
          textAlign = 'right';
          break;

        case 'center':
          textAlign = 'center';
          break;

        case 'left':
        case 'start':
        default:
          textAlign = 'left';
          break;
      }

      var pt = this.ctx.transform.applyToPoint(new Point(options.x, options.y));
      var decomposedTransformationMatrix = this.ctx.transform.decompose();
      var matrix = new Matrix();
      matrix = matrix.multiply(decomposedTransformationMatrix.translate);
      matrix = matrix.multiply(decomposedTransformationMatrix.skew);
      matrix = matrix.multiply(decomposedTransformationMatrix.scale);
      var textDimensions = this.pdf.getTextDimensions(options.text);
      var textRect = this.ctx.transform.applyToRectangle(new Rectangle(options.x, options.y, textDimensions.w, textDimensions.h));
      var textXRect = matrix.applyToRectangle(new Rectangle(options.x, options.y - textDimensions.h, textDimensions.w, textDimensions.h));
      var pageArray = getPagesByPath.call(this, textXRect);
      var pages = [];

      for (var ii = 0; ii < pageArray.length; ii += 1) {
        if (pages.indexOf(pageArray[ii]) === -1) {
          pages.push(pageArray[ii]);
        }
      }

      pages.sort();
      var clipPath;

      if (this.autoPaging === true) {
        var min = pages[0];
        var max = pages[pages.length - 1];

        for (var i = min; i < max + 1; i++) {
          this.pdf.setPage(i);

          if (this.ctx.clip_path.length !== 0) {
            var tmpPaths = this.path;
            clipPath = JSON.parse(JSON.stringify(this.ctx.clip_path));
            this.path = pathPositionRedo(clipPath, this.posX, -1 * this.pdf.internal.pageSize.height * (i - 1) + this.posY);
            drawPaths.call(this, 'fill', true);
            this.path = tmpPaths;
          }

          var tmpRect = JSON.parse(JSON.stringify(textRect));
          tmpRect = pathPositionRedo([tmpRect], this.posX, -1 * this.pdf.internal.pageSize.height * (i - 1) + this.posY)[0];

          if (options.scale >= 0.01) {
            var oldSize = this.pdf.internal.getFontSize();
            this.pdf.setFontSize(oldSize * options.scale);
          }

          this.pdf.text(options.text, tmpRect.x, tmpRect.y, {
            angle: options.angle,
            align: textAlign,
            renderingMode: options.renderingMode,
            maxWidth: options.maxWidth
          });

          if (options.scale >= 0.01) {
            this.pdf.setFontSize(oldSize);
          }
        }
      } else {
        if (options.scale >= 0.01) {
          var oldSize = this.pdf.internal.getFontSize();
          this.pdf.setFontSize(oldSize * options.scale);
        }

        this.pdf.text(options.text, pt.x + this.posX, pt.y + this.posY, {
          angle: options.angle,
          align: textAlign,
          renderingMode: options.renderingMode,
          maxWidth: options.maxWidth
        });

        if (options.scale >= 0.01) {
          this.pdf.setFontSize(oldSize);
        }
      }
    };

    var drawLine = function drawLine(x, y, prevX, prevY) {
      prevX = prevX || 0;
      prevY = prevY || 0;
      this.pdf.internal.out(getHorizontalCoordinateString(x + prevX) + ' ' + getVerticalCoordinateString(y + prevY) + ' l');
    };

    var drawLines = function drawLines(lines, x, y) {
      return this.pdf.lines(lines, x, y, null, null);
    };

    var drawCurve = function drawCurve(x, y, x1, y1, x2, y2, x3, y3) {
      this.pdf.internal.out([f2(getHorizontalCoordinate(x1 + x)), f2(getVerticalCoordinate(y1 + y)), f2(getHorizontalCoordinate(x2 + x)), f2(getVerticalCoordinate(y2 + y)), f2(getHorizontalCoordinate(x3 + x)), f2(getVerticalCoordinate(y3 + y)), 'c'].join(' '));
    };
    /**
    * Return a array of objects that represent bezier curves which approximate the circular arc centered at the origin, from startAngle to endAngle (radians) with the specified radius.
    *
    * Each bezier curve is an object with four points, where x1,y1 and x4,y4 are the arc's end points and x2,y2 and x3,y3 are the cubic bezier's control points.
    * @function createArc
    */


    var createArc = function createArc(radius, startAngle, endAngle, anticlockwise) {
      var EPSILON = 0.00001; // Roughly 1/1000th of a degree, see below        // normalize startAngle, endAngle to [-2PI, 2PI]

      var twoPI = Math.PI * 2;
      var startAngleN = startAngle;

      if (startAngleN < twoPI || startAngleN > twoPI) {
        startAngleN = startAngleN % twoPI;
      }

      var endAngleN = endAngle;

      if (endAngleN < twoPI || endAngleN > twoPI) {
        endAngleN = endAngleN % twoPI;
      } // Compute the sequence of arc curves, up to PI/2 at a time.        // Total arc angle is less than 2PI.


      var curves = [];
      var piOverTwo = Math.PI / 2.0; //var sgn = (startAngle < endAngle) ? +1 : -1; // clockwise or counterclockwise

      var sgn = anticlockwise ? -1 : +1;
      var a1 = startAngle;

      for (var totalAngle = Math.min(twoPI, Math.abs(endAngleN - startAngleN)); totalAngle > EPSILON;) {
        var a2 = a1 + sgn * Math.min(totalAngle, piOverTwo);
        curves.push(createSmallArc.call(this, radius, a1, a2));
        totalAngle -= Math.abs(a2 - a1);
        a1 = a2;
      }

      return curves;
    };
    /**
    * Cubic bezier approximation of a circular arc centered at the origin, from (radians) a1 to a2, where a2-a1 < pi/2. The arc's radius is r.
    *
    * Returns an object with four points, where x1,y1 and x4,y4 are the arc's end points and x2,y2 and x3,y3 are the cubic bezier's control points.
    *
    * This algorithm is based on the approach described in: A. Riškus, "Approximation of a Cubic Bezier Curve by Circular Arcs and Vice Versa," Information Technology and Control, 35(4), 2006 pp. 371-378.
    */


    var createSmallArc = function createSmallArc(r, a1, a2) {
      var a = (a2 - a1) / 2.0;
      var x4 = r * Math.cos(a);
      var y4 = r * Math.sin(a);
      var x1 = x4;
      var y1 = -y4;
      var q1 = x1 * x1 + y1 * y1;
      var q2 = q1 + x1 * x4 + y1 * y4;
      var k2 = 4 / 3 * (Math.sqrt(2 * q1 * q2) - q2) / (x1 * y4 - y1 * x4);
      var x2 = x1 - k2 * y1;
      var y2 = y1 + k2 * x1;
      var x3 = x2;
      var y3 = -y2;
      var ar = a + a1;
      var cos_ar = Math.cos(ar);
      var sin_ar = Math.sin(ar);
      return {
        x1: r * Math.cos(a1),
        y1: r * Math.sin(a1),
        x2: x2 * cos_ar - y2 * sin_ar,
        y2: x2 * sin_ar + y2 * cos_ar,
        x3: x3 * cos_ar - y3 * sin_ar,
        y3: x3 * sin_ar + y3 * cos_ar,
        x4: r * Math.cos(a2),
        y4: r * Math.sin(a2)
      };
    };

    var rad2deg = function rad2deg(value) {
      return value * 180 / Math.PI;
    };

    var deg2rad = function deg2rad(deg) {
      return deg * Math.PI / 180;
    };

    var getQuadraticCurveBoundary = function getQuadraticCurveBoundary(sx, sy, cpx, cpy, ex, ey) {
      var midX1 = sx + (cpx - sx) * 0.50;
      var midY1 = sy + (cpy - sy) * 0.50;
      var midX2 = ex + (cpx - ex) * 0.50;
      var midY2 = ey + (cpy - ey) * 0.50;
      var resultX1 = Math.min(sx, ex, midX1, midX2);
      var resultX2 = Math.max(sx, ex, midX1, midX2);
      var resultY1 = Math.min(sy, ey, midY1, midY2);
      var resultY2 = Math.max(sy, ey, midY1, midY2);
      return new Rectangle(resultX1, resultY1, resultX2 - resultX1, resultY2 - resultY1);
    }; //De Casteljau algorithm


    var getBezierCurveBoundary = function getBezierCurveBoundary(ax, ay, bx, by, cx, cy, dx, dy) {
      var tobx = bx - ax;
      var toby = by - ay;
      var tocx = cx - bx;
      var tocy = cy - by;
      var todx = dx - cx;
      var tody = dy - cy;
      var precision = 40;
      var d, px, py, qx, qy, rx, ry, tx, ty, sx, sy, x, y, i, minx, miny, maxx, maxy, toqx, toqy, torx, tory, totx, toty;

      for (var i = 0; i < precision + 1; i++) {
        d = i / precision;
        px = ax + d * tobx;
        py = ay + d * toby;
        qx = bx + d * tocx;
        qy = by + d * tocy;
        rx = cx + d * todx;
        ry = cy + d * tody;
        toqx = qx - px;
        toqy = qy - py;
        torx = rx - qx;
        tory = ry - qy;
        sx = px + d * toqx;
        sy = py + d * toqy;
        tx = qx + d * torx;
        ty = qy + d * tory;
        totx = tx - sx;
        toty = ty - sy;
        x = sx + d * totx;
        y = sy + d * toty;

        if (i == 0) {
          minx = x;
          miny = y;
          maxx = x;
          maxy = y;
        } else {
          minx = Math.min(minx, x);
          miny = Math.min(miny, y);
          maxx = Math.max(maxx, x);
          maxy = Math.max(maxy, y);
        }
      }

      return new Rectangle(Math.round(minx), Math.round(miny), Math.round(maxx - minx), Math.round(maxy - miny));
    };

    var Point = function Point(x, y) {
      var _x = x || 0;

      Object.defineProperty(this, 'x', {
        enumerable: true,
        get: function get() {
          return _x;
        },
        set: function set(value) {
          if (!isNaN(value)) {
            _x = parseFloat(value);
          }
        }
      });

      var _y = y || 0;

      Object.defineProperty(this, 'y', {
        enumerable: true,
        get: function get() {
          return _y;
        },
        set: function set(value) {
          if (!isNaN(value)) {
            _y = parseFloat(value);
          }
        }
      });
      var _type = 'pt';
      Object.defineProperty(this, 'type', {
        enumerable: true,
        get: function get() {
          return _type;
        },
        set: function set(value) {
          _type = value.toString();
        }
      });
      return this;
    };

    var Rectangle = function Rectangle(x, y, w, h) {
      Point.call(this, x, y);
      this.type = 'rect';

      var _w = w || 0;

      Object.defineProperty(this, 'w', {
        enumerable: true,
        get: function get() {
          return _w;
        },
        set: function set(value) {
          if (!isNaN(value)) {
            _w = parseFloat(value);
          }
        }
      });

      var _h = h || 0;

      Object.defineProperty(this, 'h', {
        enumerable: true,
        get: function get() {
          return _h;
        },
        set: function set(value) {
          if (!isNaN(value)) {
            _h = parseFloat(value);
          }
        }
      });
      return this;
    };

    var Matrix = function Matrix(sx, shy, shx, sy, tx, ty) {
      var _matrix = [];
      Object.defineProperty(this, 'sx', {
        get: function get() {
          return _matrix[0];
        },
        set: function set(value) {
          _matrix[0] = Math.round(value * 100000) / 100000;
        }
      });
      Object.defineProperty(this, 'shy', {
        get: function get() {
          return _matrix[1];
        },
        set: function set(value) {
          _matrix[1] = Math.round(value * 100000) / 100000;
        }
      });
      Object.defineProperty(this, 'shx', {
        get: function get() {
          return _matrix[2];
        },
        set: function set(value) {
          _matrix[2] = Math.round(value * 100000) / 100000;
        }
      });
      Object.defineProperty(this, 'sy', {
        get: function get() {
          return _matrix[3];
        },
        set: function set(value) {
          _matrix[3] = Math.round(value * 100000) / 100000;
        }
      });
      Object.defineProperty(this, 'tx', {
        get: function get() {
          return _matrix[4];
        },
        set: function set(value) {
          _matrix[4] = Math.round(value * 100000) / 100000;
        }
      });
      Object.defineProperty(this, 'ty', {
        get: function get() {
          return _matrix[5];
        },
        set: function set(value) {
          _matrix[5] = Math.round(value * 100000) / 100000;
        }
      });
      Object.defineProperty(this, 'rotation', {
        get: function get() {
          return Math.atan2(this.shx, this.sx);
        }
      });
      Object.defineProperty(this, 'scaleX', {
        get: function get() {
          return this.decompose().scale.sx;
        }
      });
      Object.defineProperty(this, 'scaleY', {
        get: function get() {
          return this.decompose().scale.sy;
        }
      });
      Object.defineProperty(this, 'isIdentity', {
        get: function get() {
          if (this.sx !== 1) {
            return false;
          }

          if (this.shy !== 0) {
            return false;
          }

          if (this.shx !== 0) {
            return false;
          }

          if (this.sy !== 1) {
            return false;
          }

          if (this.tx !== 0) {
            return false;
          }

          if (this.ty !== 0) {
            return false;
          }

          return true;
        }
      });
      this.sx = !isNaN(sx) ? sx : 1;
      this.shy = !isNaN(shy) ? shy : 0;
      this.shx = !isNaN(shx) ? shx : 0;
      this.sy = !isNaN(sy) ? sy : 1;
      this.tx = !isNaN(tx) ? tx : 0;
      this.ty = !isNaN(ty) ? ty : 0;
      return this;
    };
    /**
    * Multiply the matrix with given Matrix
    * 
    * @function multiply
    * @param matrix
    * @returns {Matrix}
    * @private
    * @ignore
    */


    Matrix.prototype.multiply = function (matrix) {
      var sx = matrix.sx * this.sx + matrix.shy * this.shx;
      var shy = matrix.sx * this.shy + matrix.shy * this.sy;
      var shx = matrix.shx * this.sx + matrix.sy * this.shx;
      var sy = matrix.shx * this.shy + matrix.sy * this.sy;
      var tx = matrix.tx * this.sx + matrix.ty * this.shx + this.tx;
      var ty = matrix.tx * this.shy + matrix.ty * this.sy + this.ty;
      return new Matrix(sx, shy, shx, sy, tx, ty);
    };
    /**
    * @function decompose
    * @private
    * @ignore
    */


    Matrix.prototype.decompose = function () {
      var a = this.sx;
      var b = this.shy;
      var c = this.shx;
      var d = this.sy;
      var e = this.tx;
      var f = this.ty;
      var scaleX = Math.sqrt(a * a + b * b);
      a /= scaleX;
      b /= scaleX;
      var shear = a * c + b * d;
      c -= a * shear;
      d -= b * shear;
      var scaleY = Math.sqrt(c * c + d * d);
      c /= scaleY;
      d /= scaleY;
      shear /= scaleY;

      if (a * d < b * c) {
        a = -a;
        b = -b;
        shear = -shear;
        scaleX = -scaleX;
      }

      return {
        scale: new Matrix(scaleX, 0, 0, scaleY, 0, 0),
        translate: new Matrix(1, 0, 0, 1, e, f),
        rotate: new Matrix(a, b, -b, a, 0, 0),
        skew: new Matrix(1, 0, shear, 1, 0, 0)
      };
    };
    /**
    * @function applyToPoint
    * @private
    * @ignore
    */


    Matrix.prototype.applyToPoint = function (pt) {
      var x = pt.x * this.sx + pt.y * this.shx + this.tx;
      var y = pt.x * this.shy + pt.y * this.sy + this.ty;
      return new Point(x, y);
    };
    /**
    * @function applyToRectangle
    * @private
    * @ignore
    */


    Matrix.prototype.applyToRectangle = function (rect) {
      var pt1 = this.applyToPoint(rect);
      var pt2 = this.applyToPoint(new Point(rect.x + rect.w, rect.y + rect.h));
      return new Rectangle(pt1.x, pt1.y, pt2.x - pt1.x, pt2.y - pt1.y);
    };
    /**
    * @function clone
    * @private
    * @ignore
    */


    Matrix.prototype.clone = function () {
      var sx = this.sx;
      var shy = this.shy;
      var shx = this.shx;
      var sy = this.sy;
      var tx = this.tx;
      var ty = this.ty;
      return new Matrix(sx, shy, shx, sy, tx, ty);
    };
  })(jsPDF.API, typeof self !== 'undefined' && self || typeof window !== 'undefined' && window || typeof global !== 'undefined' && global || Function('return typeof this === "object" && this.content')() || Function('return this')());

  /** @license
   * MIT license.
   * Copyright (c) 2012 Willow Systems Corporation, willow-systems.com
   *               2014 Diego Casorran, https://github.com/diegocr
   *
   * 
   * ====================================================================
   */

  /**
  * jsPDF split_text_to_size plugin 
  * 
  * @name split_text_to_size
  * @module
  */
  (function (API) {
    /**
     * Returns an array of length matching length of the 'word' string, with each
     * cell occupied by the width of the char in that position.
     * 
     * @name getCharWidthsArray
     * @function
     * @param {string} text
     * @param {Object} options
     * @returns {Array}
     */

    var getCharWidthsArray = API.getCharWidthsArray = function (text, options) {
      options = options || {};
      var activeFont = options.font || this.internal.getFont();
      var fontSize = options.fontSize || this.internal.getFontSize();
      var charSpace = options.charSpace || this.internal.getCharSpace();
      var widths = options.widths ? options.widths : activeFont.metadata.Unicode.widths;
      var widthsFractionOf = widths.fof ? widths.fof : 1;
      var kerning = options.kerning ? options.kerning : activeFont.metadata.Unicode.kerning;
      var kerningFractionOf = kerning.fof ? kerning.fof : 1;
      var i;
      var l;
      var char_code;
      var prior_char_code = 0; //for kerning

      var default_char_width = widths[0] || widthsFractionOf;
      var output = [];

      for (i = 0, l = text.length; i < l; i++) {
        char_code = text.charCodeAt(i);

        if (typeof activeFont.metadata.widthOfString === "function") {
          output.push((activeFont.metadata.widthOfGlyph(activeFont.metadata.characterToGlyph(char_code)) + charSpace * (1000 / fontSize) || 0) / 1000);
        } else {
          output.push((widths[char_code] || default_char_width) / widthsFractionOf + (kerning[char_code] && kerning[char_code][prior_char_code] || 0) / kerningFractionOf);
        }

        prior_char_code = char_code;
      }

      return output;
    };
    /**
     * Calculate the sum of a number-array
     * 
     * @name getArraySum
     * @public
     * @function
     * @param {Array} array Array of numbers
     * @returns {number}
     */


    var getArraySum = API.getArraySum = function (array) {
      var i = array.length,
          output = 0;

      while (i) {
        i--;
        output += array[i];
      }

      return output;
    };
    /**
    * Returns a widths of string in a given font, if the font size is set as 1 point.
    *
    * In other words, this is "proportional" value. For 1 unit of font size, the length
    * of the string will be that much.
    * 
    * Multiply by font size to get actual width in *points*
    * Then divide by 72 to get inches or divide by (72/25.6) to get 'mm' etc.
    * 
    * @name getStringUnitWidth
    * @public
    * @function
    * @param {string} text
    * @param {string} options
    * @returns {number} result
    */


    var getStringUnitWidth = API.getStringUnitWidth = function (text, options) {
      options = options || {};
      var fontSize = options.fontSize || this.internal.getFontSize();
      var font = options.font || this.internal.getFont();
      var charSpace = options.charSpace || this.internal.getCharSpace();
      var result = 0;

      if (typeof font.metadata.widthOfString === "function") {
        result = font.metadata.widthOfString(text, fontSize, charSpace) / fontSize;
      } else {
        result = getArraySum(getCharWidthsArray.apply(this, arguments));
      }

      return result;
    };
    /**
    returns array of lines
    */


    var splitLongWord = function splitLongWord(word, widths_array, firstLineMaxLen, maxLen) {
      var answer = []; // 1st, chop off the piece that can fit on the hanging line.

      var i = 0,
          l = word.length,
          workingLen = 0;

      while (i !== l && workingLen + widths_array[i] < firstLineMaxLen) {
        workingLen += widths_array[i];
        i++;
      } // this is first line.


      answer.push(word.slice(0, i)); // 2nd. Split the rest into maxLen pieces.

      var startOfLine = i;
      workingLen = 0;

      while (i !== l) {
        if (workingLen + widths_array[i] > maxLen) {
          answer.push(word.slice(startOfLine, i));
          workingLen = 0;
          startOfLine = i;
        }

        workingLen += widths_array[i];
        i++;
      }

      if (startOfLine !== i) {
        answer.push(word.slice(startOfLine, i));
      }

      return answer;
    }; // Note, all sizing inputs for this function must be in "font measurement units"
    // By default, for PDF, it's "point".


    var splitParagraphIntoLines = function splitParagraphIntoLines(text, maxlen, options) {
      // at this time works only on Western scripts, ones with space char
      // separating the words. Feel free to expand.
      if (!options) {
        options = {};
      }

      var line = [],
          lines = [line],
          line_length = options.textIndent || 0,
          separator_length = 0,
          current_word_length = 0,
          word,
          widths_array,
          words = text.split(' '),
          spaceCharWidth = getCharWidthsArray.apply(this, [' ', options])[0],
          i,
          l,
          tmp,
          lineIndent;

      if (options.lineIndent === -1) {
        lineIndent = words[0].length + 2;
      } else {
        lineIndent = options.lineIndent || 0;
      }

      if (lineIndent) {
        var pad = Array(lineIndent).join(" "),
            wrds = [];
        words.map(function (wrd) {
          wrd = wrd.split(/\s*\n/);

          if (wrd.length > 1) {
            wrds = wrds.concat(wrd.map(function (wrd, idx) {
              return (idx && wrd.length ? "\n" : "") + wrd;
            }));
          } else {
            wrds.push(wrd[0]);
          }
        });
        words = wrds;
        lineIndent = getStringUnitWidth.apply(this, [pad, options]);
      }

      for (i = 0, l = words.length; i < l; i++) {
        var force = 0;
        word = words[i];

        if (lineIndent && word[0] == "\n") {
          word = word.substr(1);
          force = 1;
        }

        widths_array = getCharWidthsArray.apply(this, [word, options]);
        current_word_length = getArraySum(widths_array);

        if (line_length + separator_length + current_word_length > maxlen || force) {
          if (current_word_length > maxlen) {
            // this happens when you have space-less long URLs for example.
            // we just chop these to size. We do NOT insert hiphens
            tmp = splitLongWord.apply(this, [word, widths_array, maxlen - (line_length + separator_length), maxlen]); // first line we add to existing line object

            line.push(tmp.shift()); // it's ok to have extra space indicator there
            // last line we make into new line object

            line = [tmp.pop()]; // lines in the middle we apped to lines object as whole lines

            while (tmp.length) {
              lines.push([tmp.shift()]); // single fragment occupies whole line
            }

            current_word_length = getArraySum(widths_array.slice(word.length - (line[0] ? line[0].length : 0)));
          } else {
            // just put it on a new line
            line = [word];
          } // now we attach new line to lines


          lines.push(line);
          line_length = current_word_length + lineIndent;
          separator_length = spaceCharWidth;
        } else {
          line.push(word);
          line_length += separator_length + current_word_length;
          separator_length = spaceCharWidth;
        }
      }

      if (lineIndent) {
        var postProcess = function postProcess(ln, idx) {
          return (idx ? pad : '') + ln.join(" ");
        };
      } else {
        var postProcess = function postProcess(ln) {
          return ln.join(" ");
        };
      }

      return lines.map(postProcess);
    };
    /**
    * Splits a given string into an array of strings. Uses 'size' value
    * (in measurement units declared as default for the jsPDF instance)
    * and the font's "widths" and "Kerning" tables, where available, to
    * determine display length of a given string for a given font.
    * 
    * We use character's 100% of unit size (height) as width when Width
    * table or other default width is not available.
    * 
    * @name splitTextToSize
    * @public
    * @function
    * @param {string} text Unencoded, regular JavaScript (Unicode, UTF-16 / UCS-2) string.
    * @param {number} size Nominal number, measured in units default to this instance of jsPDF.
    * @param {Object} options Optional flags needed for chopper to do the right thing.
    * @returns {Array} array Array with strings chopped to size.
    */


    API.splitTextToSize = function (text, maxlen, options) {

      options = options || {};

      var fsize = options.fontSize || this.internal.getFontSize(),
          newOptions = function (options) {
        var widths = {
          0: 1
        },
            kerning = {};

        if (!options.widths || !options.kerning) {
          var f = this.internal.getFont(options.fontName, options.fontStyle),
              encoding = 'Unicode'; // NOT UTF8, NOT UTF16BE/LE, NOT UCS2BE/LE
          // Actual JavaScript-native String's 16bit char codes used.
          // no multi-byte logic here

          if (f.metadata[encoding]) {
            return {
              widths: f.metadata[encoding].widths || widths,
              kerning: f.metadata[encoding].kerning || kerning
            };
          } else {
            return {
              font: f.metadata,
              fontSize: this.internal.getFontSize(),
              charSpace: this.internal.getCharSpace()
            };
          }
        } else {
          return {
            widths: options.widths,
            kerning: options.kerning
          };
        } // then use default values


        return {
          widths: widths,
          kerning: kerning
        };
      }.call(this, options); // first we split on end-of-line chars


      var paragraphs;

      if (Array.isArray(text)) {
        paragraphs = text;
      } else {
        paragraphs = text.split(/\r?\n/);
      } // now we convert size (max length of line) into "font size units"
      // at present time, the "font size unit" is always 'point'
      // 'proportional' means, "in proportion to font size"


      var fontUnit_maxLen = 1.0 * this.internal.scaleFactor * maxlen / fsize; // at this time, fsize is always in "points" regardless of the default measurement unit of the doc.
      // this may change in the future?
      // until then, proportional_maxlen is likely to be in 'points'
      // If first line is to be indented (shorter or longer) than maxLen
      // we indicate that by using CSS-style "text-indent" option.
      // here it's in font units too (which is likely 'points')
      // it can be negative (which makes the first line longer than maxLen)

      newOptions.textIndent = options.textIndent ? options.textIndent * 1.0 * this.internal.scaleFactor / fsize : 0;
      newOptions.lineIndent = options.lineIndent;
      var i,
          l,
          output = [];

      for (i = 0, l = paragraphs.length; i < l; i++) {
        output = output.concat(splitParagraphIntoLines.apply(this, [paragraphs[i], fontUnit_maxLen, newOptions]));
      }

      return output;
    };
  })(jsPDF.API);

  /** @license
   jsPDF standard_fonts_metrics plugin
   * Copyright (c) 2012 Willow Systems Corporation, willow-systems.com
   * MIT license.
   * 
   * ====================================================================
   */

  (function (API) {
    /*
    # reference (Python) versions of 'compress' and 'uncompress'
    # only 'uncompress' function is featured lower as JavaScript
    # if you want to unit test "roundtrip", just transcribe the reference
    # 'compress' function from Python into JavaScript
    
    def compress(data):
    
    	keys =   '0123456789abcdef'
    	values = 'klmnopqrstuvwxyz'
    	mapping = dict(zip(keys, values))
    	vals = []
    	for key in data.keys():
    		value = data[key]
    		try:
    			keystring = hex(key)[2:]
    			keystring = keystring[:-1] + mapping[keystring[-1:]]
    		except:
    			keystring = key.join(["'","'"])
    			#print('Keystring is %s' % keystring)
    
    		try:
    			if value < 0:
    				valuestring = hex(value)[3:]
    				numberprefix = '-'
    			else:
    				valuestring = hex(value)[2:]
    				numberprefix = ''
    			valuestring = numberprefix + valuestring[:-1] + mapping[valuestring[-1:]]
    		except:
    			if type(value) == dict:
    				valuestring = compress(value)
    			else:
    				raise Exception("Don't know what to do with value type %s" % type(value))
    
    		vals.append(keystring+valuestring)
    	
    	return '{' + ''.join(vals) + '}'
    
    def uncompress(data):
    
    	decoded = '0123456789abcdef'
    	encoded = 'klmnopqrstuvwxyz'
    	mapping = dict(zip(encoded, decoded))
    
    	sign = +1
    	stringmode = False
    	stringparts = []
    
    	output = {}
    
    	activeobject = output
    	parentchain = []
    
    	keyparts = ''
    	valueparts = ''
    
    	key = None
    
    	ending = set(encoded)
    
    	i = 1
    	l = len(data) - 1 # stripping starting, ending {}
    	while i != l: # stripping {}
    		# -, {, }, ' are special.
    
    		ch = data[i]
    		i += 1
    
    		if ch == "'":
    			if stringmode:
    				# end of string mode
    				stringmode = False
    				key = ''.join(stringparts)
    			else:
    				# start of string mode
    				stringmode = True
    				stringparts = []
    		elif stringmode == True:
    			#print("Adding %s to stringpart" % ch)
    			stringparts.append(ch)
    
    		elif ch == '{':
    			# start of object
    			parentchain.append( [activeobject, key] )
    			activeobject = {}
    			key = None
    			#DEBUG = True
    		elif ch == '}':
    			# end of object
    			parent, key = parentchain.pop()
    			parent[key] = activeobject
    			key = None
    			activeobject = parent
    			#DEBUG = False
    
    		elif ch == '-':
    			sign = -1
    		else:
    			# must be number
    			if key == None:
    				#debug("In Key. It is '%s', ch is '%s'" % (keyparts, ch))
    				if ch in ending:
    					#debug("End of key")
    					keyparts += mapping[ch]
    					key = int(keyparts, 16) * sign
    					sign = +1
    					keyparts = ''
    				else:
    					keyparts += ch
    			else:
    				#debug("In value. It is '%s', ch is '%s'" % (valueparts, ch))
    				if ch in ending:
    					#debug("End of value")
    					valueparts += mapping[ch]
    					activeobject[key] = int(valueparts, 16) * sign
    					sign = +1
    					key = None
    					valueparts = ''
    				else:
    					valueparts += ch
    
    			#debug(activeobject)
    
    	return output
    
    */

    /**
    Uncompresses data compressed into custom, base16-like format. 
    @public
    @function
    @param
    @returns {Type}
    */

    var uncompress = function uncompress(data) {
      var decoded = '0123456789abcdef',
          encoded = 'klmnopqrstuvwxyz',
          mapping = {};

      for (var i = 0; i < encoded.length; i++) {
        mapping[encoded[i]] = decoded[i];
      }

      var undef,
          output = {},
          sign = 1,
          stringparts // undef. will be [] in string mode
      ,
          activeobject = output,
          parentchain = [],
          parent_key_pair,
          keyparts = '',
          valueparts = '',
          key // undef. will be Truthy when Key is resolved.
      ,
          datalen = data.length - 1 // stripping ending }
      ,
          ch;
      i = 1; // stripping starting {

      while (i != datalen) {
        // - { } ' are special.
        ch = data[i];
        i += 1;

        if (ch == "'") {
          if (stringparts) {
            // end of string mode
            key = stringparts.join('');
            stringparts = undef;
          } else {
            // start of string mode
            stringparts = [];
          }
        } else if (stringparts) {
          stringparts.push(ch);
        } else if (ch == '{') {
          // start of object
          parentchain.push([activeobject, key]);
          activeobject = {};
          key = undef;
        } else if (ch == '}') {
          // end of object
          parent_key_pair = parentchain.pop();
          parent_key_pair[0][parent_key_pair[1]] = activeobject;
          key = undef;
          activeobject = parent_key_pair[0];
        } else if (ch == '-') {
          sign = -1;
        } else {
          // must be number
          if (key === undef) {
            if (mapping.hasOwnProperty(ch)) {
              keyparts += mapping[ch];
              key = parseInt(keyparts, 16) * sign;
              sign = +1;
              keyparts = '';
            } else {
              keyparts += ch;
            }
          } else {
            if (mapping.hasOwnProperty(ch)) {
              valueparts += mapping[ch];
              activeobject[key] = parseInt(valueparts, 16) * sign;
              sign = +1;
              key = undef;
              valueparts = '';
            } else {
              valueparts += ch;
            }
          }
        }
      } // end while


      return output;
    }; // encoding = 'Unicode' 
    // NOT UTF8, NOT UTF16BE/LE, NOT UCS2BE/LE. NO clever BOM behavior
    // Actual 16bit char codes used.
    // no multi-byte logic here
    // Unicode characters to WinAnsiEncoding:
    // {402: 131, 8211: 150, 8212: 151, 8216: 145, 8217: 146, 8218: 130, 8220: 147, 8221: 148, 8222: 132, 8224: 134, 8225: 135, 8226: 149, 8230: 133, 8364: 128, 8240:137, 8249: 139, 8250: 155, 710: 136, 8482: 153, 338: 140, 339: 156, 732: 152, 352: 138, 353: 154, 376: 159, 381: 142, 382: 158}
    // as you can see, all Unicode chars are outside of 0-255 range. No char code conflicts.
    // this means that you can give Win cp1252 encoded strings to jsPDF for rendering directly
    // as well as give strings with some (supported by these fonts) Unicode characters and 
    // these will be mapped to win cp1252 
    // for example, you can send char code (cp1252) 0x80 or (unicode) 0x20AC, getting "Euro" glyph displayed in both cases.


    var encodingBlock = {
      'codePages': ['WinAnsiEncoding'],
      'WinAnsiEncoding': uncompress("{19m8n201n9q201o9r201s9l201t9m201u8m201w9n201x9o201y8o202k8q202l8r202m9p202q8p20aw8k203k8t203t8v203u9v2cq8s212m9t15m8w15n9w2dw9s16k8u16l9u17s9z17x8y17y9y}")
    },
        encodings = {
      'Unicode': {
        'Courier': encodingBlock,
        'Courier-Bold': encodingBlock,
        'Courier-BoldOblique': encodingBlock,
        'Courier-Oblique': encodingBlock,
        'Helvetica': encodingBlock,
        'Helvetica-Bold': encodingBlock,
        'Helvetica-BoldOblique': encodingBlock,
        'Helvetica-Oblique': encodingBlock,
        'Times-Roman': encodingBlock,
        'Times-Bold': encodingBlock,
        'Times-BoldItalic': encodingBlock,
        'Times-Italic': encodingBlock //	, 'Symbol'
        //	, 'ZapfDingbats'

      }
    },
        fontMetrics = {
      'Unicode': {
        // all sizing numbers are n/fontMetricsFractionOf = one font size unit
        // this means that if fontMetricsFractionOf = 1000, and letter A's width is 476, it's
        // width is 476/1000 or 47.6% of its height (regardless of font size)
        // At this time this value applies to "widths" and "kerning" numbers.
        // char code 0 represents "default" (average) width - use it for chars missing in this table.
        // key 'fof' represents the "fontMetricsFractionOf" value
        'Courier-Oblique': uncompress("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),
        'Times-BoldItalic': uncompress("{'widths'{k3o2q4ycx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2r202m2n2n3m2o3m2p5n202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5n4l4m4m4m4n4m4o4s4p4m4q4m4r4s4s4y4t2r4u3m4v4m4w3x4x5t4y4s4z4s5k3x5l4s5m4m5n3r5o3x5p4s5q4m5r5t5s4m5t3x5u3x5v2l5w1w5x2l5y3t5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q2l6r3m6s3r6t1w6u1w6v3m6w1w6x4y6y3r6z3m7k3m7l3m7m2r7n2r7o1w7p3r7q2w7r4m7s3m7t2w7u2r7v2n7w1q7x2n7y3t202l3mcl4mal2ram3man3mao3map3mar3mas2lat4uau1uav3maw3way4uaz2lbk2sbl3t'fof'6obo2lbp3tbq3mbr1tbs2lbu1ybv3mbz3mck4m202k3mcm4mcn4mco4mcp4mcq5ycr4mcs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz2w203k6o212m6o2dw2l2cq2l3t3m3u2l17s3x19m3m}'kerning'{cl{4qu5kt5qt5rs17ss5ts}201s{201ss}201t{cks4lscmscnscoscpscls2wu2yu201ts}201x{2wu2yu}2k{201ts}2w{4qx5kx5ou5qx5rs17su5tu}2x{17su5tu5ou}2y{4qx5kx5ou5qx5rs17ss5ts}'fof'-6ofn{17sw5tw5ou5qw5rs}7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qs}3v{17su5tu5os5qs}7p{17su5tu}ck{4qu5kt5qt5rs17ss5ts}4l{4qu5kt5qt5rs17ss5ts}cm{4qu5kt5qt5rs17ss5ts}cn{4qu5kt5qt5rs17ss5ts}co{4qu5kt5qt5rs17ss5ts}cp{4qu5kt5qt5rs17ss5ts}6l{4qu5ou5qw5rt17su5tu}5q{ckuclucmucnucoucpu4lu}5r{ckuclucmucnucoucpu4lu}7q{cksclscmscnscoscps4ls}6p{4qu5ou5qw5rt17sw5tw}ek{4qu5ou5qw5rt17su5tu}el{4qu5ou5qw5rt17su5tu}em{4qu5ou5qw5rt17su5tu}en{4qu5ou5qw5rt17su5tu}eo{4qu5ou5qw5rt17su5tu}ep{4qu5ou5qw5rt17su5tu}es{17ss5ts5qs4qu}et{4qu5ou5qw5rt17sw5tw}eu{4qu5ou5qw5rt17ss5ts}ev{17ss5ts5qs4qu}6z{17sw5tw5ou5qw5rs}fm{17sw5tw5ou5qw5rs}7n{201ts}fo{17sw5tw5ou5qw5rs}fp{17sw5tw5ou5qw5rs}fq{17sw5tw5ou5qw5rs}7r{cksclscmscnscoscps4ls}fs{17sw5tw5ou5qw5rs}ft{17su5tu}fu{17su5tu}fv{17su5tu}fw{17su5tu}fz{cksclscmscnscoscps4ls}}}"),
        'Helvetica-Bold': uncompress("{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}"),
        'Courier': uncompress("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),
        'Courier-BoldOblique': uncompress("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),
        'Times-Bold': uncompress("{'widths'{k3q2q5ncx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2l202m2n2n3m2o3m2p6o202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5x4l4s4m4m4n4s4o4s4p4m4q3x4r4y4s4y4t2r4u3m4v4y4w4m4x5y4y4s4z4y5k3x5l4y5m4s5n3r5o4m5p4s5q4s5r6o5s4s5t4s5u4m5v2l5w1w5x2l5y3u5z3m6k2l6l3m6m3r6n2w6o3r6p2w6q2l6r3m6s3r6t1w6u2l6v3r6w1w6x5n6y3r6z3m7k3r7l3r7m2w7n2r7o2l7p3r7q3m7r4s7s3m7t3m7u2w7v2r7w1q7x2r7y3o202l3mcl4sal2lam3man3mao3map3mar3mas2lat4uau1yav3maw3tay4uaz2lbk2sbl3t'fof'6obo2lbp3rbr1tbs2lbu2lbv3mbz3mck4s202k3mcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3rek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3m3u2l17s4s19m3m}'kerning'{cl{4qt5ks5ot5qy5rw17sv5tv}201t{cks4lscmscnscoscpscls4wv}2k{201ts}2w{4qu5ku7mu5os5qx5ru17su5tu}2x{17su5tu5ou5qs}2y{4qv5kv7mu5ot5qz5ru17su5tu}'fof'-6o7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qu}3v{17su5tu5os5qu}fu{17su5tu5ou5qu}7p{17su5tu5ou5qu}ck{4qt5ks5ot5qy5rw17sv5tv}4l{4qt5ks5ot5qy5rw17sv5tv}cm{4qt5ks5ot5qy5rw17sv5tv}cn{4qt5ks5ot5qy5rw17sv5tv}co{4qt5ks5ot5qy5rw17sv5tv}cp{4qt5ks5ot5qy5rw17sv5tv}6l{17st5tt5ou5qu}17s{ckuclucmucnucoucpu4lu4wu}5o{ckuclucmucnucoucpu4lu4wu}5q{ckzclzcmzcnzcozcpz4lz4wu}5r{ckxclxcmxcnxcoxcpx4lx4wu}5t{ckuclucmucnucoucpu4lu4wu}7q{ckuclucmucnucoucpu4lu}6p{17sw5tw5ou5qu}ek{17st5tt5qu}el{17st5tt5ou5qu}em{17st5tt5qu}en{17st5tt5qu}eo{17st5tt5qu}ep{17st5tt5ou5qu}es{17ss5ts5qu}et{17sw5tw5ou5qu}eu{17sw5tw5ou5qu}ev{17ss5ts5qu}6z{17sw5tw5ou5qu5rs}fm{17sw5tw5ou5qu5rs}fn{17sw5tw5ou5qu5rs}fo{17sw5tw5ou5qu5rs}fp{17sw5tw5ou5qu5rs}fq{17sw5tw5ou5qu5rs}7r{cktcltcmtcntcotcpt4lt5os}fs{17sw5tw5ou5qu5rs}ft{17su5tu5ou5qu}7m{5os}fv{17su5tu5ou5qu}fw{17su5tu5ou5qu}fz{cksclscmscnscoscps4ls}}}"),
        'Symbol': uncompress("{'widths'{k3uaw4r19m3m2k1t2l2l202m2y2n3m2p5n202q6o3k3m2s2l2t2l2v3r2w1t3m3m2y1t2z1wbk2sbl3r'fof'6o3n3m3o3m3p3m3q3m3r3m3s3m3t3m3u1w3v1w3w3r3x3r3y3r3z2wbp3t3l3m5v2l5x2l5z3m2q4yfr3r7v3k7w1o7x3k}'kerning'{'fof'-6o}}"),
        'Helvetica': uncompress("{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}"),
        'Helvetica-BoldOblique': uncompress("{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}"),
        'ZapfDingbats': uncompress("{'widths'{k4u2k1w'fof'6o}'kerning'{'fof'-6o}}"),
        'Courier-Bold': uncompress("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),
        'Times-Italic': uncompress("{'widths'{k3n2q4ycx2l201n3m201o5t201s2l201t2l201u2l201w3r201x3r201y3r2k1t2l2l202m2n2n3m2o3m2p5n202q5t2r1p2s2l2t2l2u3m2v4n2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w4n3x4n3y4n3z3m4k5w4l3x4m3x4n4m4o4s4p3x4q3x4r4s4s4s4t2l4u2w4v4m4w3r4x5n4y4m4z4s5k3x5l4s5m3x5n3m5o3r5p4s5q3x5r5n5s3x5t3r5u3r5v2r5w1w5x2r5y2u5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q1w6r3m6s3m6t1w6u1w6v2w6w1w6x4s6y3m6z3m7k3m7l3m7m2r7n2r7o1w7p3m7q2w7r4m7s2w7t2w7u2r7v2s7w1v7x2s7y3q202l3mcl3xal2ram3man3mao3map3mar3mas2lat4wau1vav3maw4nay4waz2lbk2sbl4n'fof'6obo2lbp3mbq3obr1tbs2lbu1zbv3mbz3mck3x202k3mcm3xcn3xco3xcp3xcq5tcr4mcs3xct3xcu3xcv3xcw2l2m2ucy2lcz2ldl4mdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr4nfs3mft3mfu3mfv3mfw3mfz2w203k6o212m6m2dw2l2cq2l3t3m3u2l17s3r19m3m}'kerning'{cl{5kt4qw}201s{201sw}201t{201tw2wy2yy6q-t}201x{2wy2yy}2k{201tw}2w{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}2x{17ss5ts5os}2y{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}'fof'-6o6t{17ss5ts5qs}7t{5os}3v{5qs}7p{17su5tu5qs}ck{5kt4qw}4l{5kt4qw}cm{5kt4qw}cn{5kt4qw}co{5kt4qw}cp{5kt4qw}6l{4qs5ks5ou5qw5ru17su5tu}17s{2ks}5q{ckvclvcmvcnvcovcpv4lv}5r{ckuclucmucnucoucpu4lu}5t{2ks}6p{4qs5ks5ou5qw5ru17su5tu}ek{4qs5ks5ou5qw5ru17su5tu}el{4qs5ks5ou5qw5ru17su5tu}em{4qs5ks5ou5qw5ru17su5tu}en{4qs5ks5ou5qw5ru17su5tu}eo{4qs5ks5ou5qw5ru17su5tu}ep{4qs5ks5ou5qw5ru17su5tu}es{5ks5qs4qs}et{4qs5ks5ou5qw5ru17su5tu}eu{4qs5ks5qw5ru17su5tu}ev{5ks5qs4qs}ex{17ss5ts5qs}6z{4qv5ks5ou5qw5ru17su5tu}fm{4qv5ks5ou5qw5ru17su5tu}fn{4qv5ks5ou5qw5ru17su5tu}fo{4qv5ks5ou5qw5ru17su5tu}fp{4qv5ks5ou5qw5ru17su5tu}fq{4qv5ks5ou5qw5ru17su5tu}7r{5os}fs{4qv5ks5ou5qw5ru17su5tu}ft{17su5tu5qs}fu{17su5tu5qs}fv{17su5tu5qs}fw{17su5tu5qs}}}"),
        'Times-Roman': uncompress("{'widths'{k3n2q4ycx2l201n3m201o6o201s2l201t2l201u2l201w2w201x2w201y2w2k1t2l2l202m2n2n3m2o3m2p5n202q6o2r1m2s2l2t2l2u3m2v3s2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v1w3w3s3x3s3y3s3z2w4k5w4l4s4m4m4n4m4o4s4p3x4q3r4r4s4s4s4t2l4u2r4v4s4w3x4x5t4y4s4z4s5k3r5l4s5m4m5n3r5o3x5p4s5q4s5r5y5s4s5t4s5u3x5v2l5w1w5x2l5y2z5z3m6k2l6l2w6m3m6n2w6o3m6p2w6q2l6r3m6s3m6t1w6u1w6v3m6w1w6x4y6y3m6z3m7k3m7l3m7m2l7n2r7o1w7p3m7q3m7r4s7s3m7t3m7u2w7v3k7w1o7x3k7y3q202l3mcl4sal2lam3man3mao3map3mar3mas2lat4wau1vav3maw3say4waz2lbk2sbl3s'fof'6obo2lbp3mbq2xbr1tbs2lbu1zbv3mbz2wck4s202k3mcm4scn4sco4scp4scq5tcr4mcs3xct3xcu3xcv3xcw2l2m2tcy2lcz2ldl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek2wel2wem2wen2weo2wep2weq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr3sfs3mft3mfu3mfv3mfw3mfz3m203k6o212m6m2dw2l2cq2l3t3m3u1w17s4s19m3m}'kerning'{cl{4qs5ku17sw5ou5qy5rw201ss5tw201ws}201s{201ss}201t{ckw4lwcmwcnwcowcpwclw4wu201ts}2k{201ts}2w{4qs5kw5os5qx5ru17sx5tx}2x{17sw5tw5ou5qu}2y{4qs5kw5os5qx5ru17sx5tx}'fof'-6o7t{ckuclucmucnucoucpu4lu5os5rs}3u{17su5tu5qs}3v{17su5tu5qs}7p{17sw5tw5qs}ck{4qs5ku17sw5ou5qy5rw201ss5tw201ws}4l{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cm{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cn{4qs5ku17sw5ou5qy5rw201ss5tw201ws}co{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cp{4qs5ku17sw5ou5qy5rw201ss5tw201ws}6l{17su5tu5os5qw5rs}17s{2ktclvcmvcnvcovcpv4lv4wuckv}5o{ckwclwcmwcnwcowcpw4lw4wu}5q{ckyclycmycnycoycpy4ly4wu5ms}5r{cktcltcmtcntcotcpt4lt4ws}5t{2ktclvcmvcnvcovcpv4lv4wuckv}7q{cksclscmscnscoscps4ls}6p{17su5tu5qw5rs}ek{5qs5rs}el{17su5tu5os5qw5rs}em{17su5tu5os5qs5rs}en{17su5qs5rs}eo{5qs5rs}ep{17su5tu5os5qw5rs}es{5qs}et{17su5tu5qw5rs}eu{17su5tu5qs5rs}ev{5qs}6z{17sv5tv5os5qx5rs}fm{5os5qt5rs}fn{17sv5tv5os5qx5rs}fo{17sv5tv5os5qx5rs}fp{5os5qt5rs}fq{5os5qt5rs}7r{ckuclucmucnucoucpu4lu5os}fs{17sv5tv5os5qx5rs}ft{17ss5ts5qs}fu{17sw5tw5qs}fv{17sw5tw5qs}fw{17ss5ts5qs}fz{ckuclucmucnucoucpu4lu5os5rs}}}"),
        'Helvetica-Oblique': uncompress("{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}")
      }
    };
    /*
    This event handler is fired when a new jsPDF object is initialized
    This event handler appends metrics data to standard fonts within
    that jsPDF instance. The metrics are mapped over Unicode character
    codes, NOT CIDs or other codes matching the StandardEncoding table of the
    standard PDF fonts.
    Future:
    Also included is the encoding maping table, converting Unicode (UCS-2, UTF-16)
    char codes to StandardEncoding character codes. The encoding table is to be used
    somewhere around "pdfEscape" call.
    */

    API.events.push(['addFont', function (data) {
      var font = data.font;
      var metrics,
          unicode_section,
          encoding = 'Unicode',
          encodingBlock;
      metrics = fontMetrics[encoding][font.postScriptName];

      if (metrics) {
        if (font.metadata[encoding]) {
          unicode_section = font.metadata[encoding];
        } else {
          unicode_section = font.metadata[encoding] = {};
        }

        unicode_section.widths = metrics.widths;
        unicode_section.kerning = metrics.kerning;
      }

      encodingBlock = encodings[encoding][font.postScriptName];

      if (encodingBlock) {
        if (font.metadata[encoding]) {
          unicode_section = font.metadata[encoding];
        } else {
          unicode_section = font.metadata[encoding] = {};
        }

        unicode_section.encoding = encodingBlock;

        if (encodingBlock.codePages && encodingBlock.codePages.length) {
          font.encoding = encodingBlock.codePages[0];
        }
      }
    }]); // end of adding event handler
  })(jsPDF.API);

  /**
   * @license
   * Licensed under the MIT License.
   * http://opensource.org/licenses/mit-license
   */

  /**
  * @name ttfsupport
  * @module
  */
  (function (jsPDF, global) {

    jsPDF.API.events.push(['addFont', function (data) {
      var font = data.font;
      var instance = data.instance;

      if (typeof instance !== "undefined" && instance.existsFileInVFS(font.postScriptName)) {
        var file = instance.getFileFromVFS(font.postScriptName);

        if (typeof file !== "string") {
          throw new Error("Font is not stored as string-data in vFS, import fonts or remove declaration doc.addFont('" + font.postScriptName + "').");
        }

        font.metadata = jsPDF.API.TTFFont.open(font.postScriptName, font.fontName, file, font.encoding);
        font.metadata.Unicode = font.metadata.Unicode || {
          encoding: {},
          kerning: {},
          widths: []
        };
        font.metadata.glyIdsUsed = [0];
      } else if (font.isStandardFont === false) {
        throw new Error("Font does not exist in vFS, import fonts or remove declaration doc.addFont('" + font.postScriptName + "').");
      }
    }]); // end of adding event handler
  })(jsPDF, typeof self !== "undefined" && self || typeof global !== "undefined" && global || typeof window !== "undefined" && window || Function("return this")());

  /**
  * @name utf8
  * @module
  */
  (function (jsPDF, global) {

    var jsPDFAPI = jsPDF.API;
    /**************************************************/

    /* function : toHex                               */

    /* comment : Replace str with a hex string.       */

    /**************************************************/

    function toHex(str) {
      var hex = '';

      for (var i = 0; i < str.length; i++) {
        hex += '' + str.charCodeAt(i).toString(16);
      }

      return hex;
    }
    /***************************************************************************************************/

    /* function : pdfEscape16                                                                          */

    /* comment : The character id of a 2-byte string is converted to a hexadecimal number by obtaining */

    /*   the corresponding glyph id and width, and then adding padding to the string.                  */

    /***************************************************************************************************/


    var pdfEscape16 = jsPDFAPI.pdfEscape16 = function (text, font) {
      var widths = font.metadata.Unicode.widths;
      var padz = ["", "0", "00", "000", "0000"];
      var ar = [""];

      for (var i = 0, l = text.length, t; i < l; ++i) {
        t = font.metadata.characterToGlyph(text.charCodeAt(i));
        font.metadata.glyIdsUsed.push(t);
        font.metadata.toUnicode[t] = text.charCodeAt(i);

        if (widths.indexOf(t) == -1) {
          widths.push(t);
          widths.push([parseInt(font.metadata.widthOfGlyph(t), 10)]);
        }

        if (t == '0') {
          //Spaces are not allowed in cmap.
          return ar.join("");
        } else {
          t = t.toString(16);
          ar.push(padz[4 - t.length], t);
        }
      }

      return ar.join("");
    };

    var toUnicodeCmap = function toUnicodeCmap(map) {
      var code, codes, range, unicode, unicodeMap, _i, _len;

      unicodeMap = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo <<\n  /Registry (Adobe)\n  /Ordering (UCS)\n  /Supplement 0\n>> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000><ffff>\nendcodespacerange';
      codes = Object.keys(map).sort(function (a, b) {
        return a - b;
      });
      range = [];

      for (_i = 0, _len = codes.length; _i < _len; _i++) {
        code = codes[_i];

        if (range.length >= 100) {
          unicodeMap += "\n" + range.length + " beginbfchar\n" + range.join('\n') + "\nendbfchar";
          range = [];
        }

        unicode = ('0000' + map[code].toString(16)).slice(-4);
        code = ('0000' + (+code).toString(16)).slice(-4);
        range.push("<" + code + "><" + unicode + ">");
      }

      if (range.length) {
        unicodeMap += "\n" + range.length + " beginbfchar\n" + range.join('\n') + "\nendbfchar\n";
      }

      unicodeMap += 'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
      return unicodeMap;
    };

    var identityHFunction = function identityHFunction(font, out, newObject, putStream) {
      if (font.metadata instanceof jsPDF.API.TTFFont && font.encoding === 'Identity-H') {
        //Tag with Identity-H
        var widths = font.metadata.Unicode.widths;
        var data = font.metadata.subset.encode(font.metadata.glyIdsUsed, 1);
        var pdfOutput = data;
        var pdfOutput2 = "";

        for (var i = 0; i < pdfOutput.length; i++) {
          pdfOutput2 += String.fromCharCode(pdfOutput[i]);
        }

        var fontTable = newObject();
        putStream({
          data: pdfOutput2,
          addLength1: true
        });
        out('endobj');
        var cmap = newObject();
        var cmapData = toUnicodeCmap(font.metadata.toUnicode);
        putStream({
          data: cmapData,
          addLength1: true
        });
        out('endobj');
        var fontDescriptor = newObject();
        out('<<');
        out('/Type /FontDescriptor');
        out('/FontName /' + font.fontName);
        out('/FontFile2 ' + fontTable + ' 0 R');
        out('/FontBBox ' + jsPDF.API.PDFObject.convert(font.metadata.bbox));
        out('/Flags ' + font.metadata.flags);
        out('/StemV ' + font.metadata.stemV);
        out('/ItalicAngle ' + font.metadata.italicAngle);
        out('/Ascent ' + font.metadata.ascender);
        out('/Descent ' + font.metadata.decender);
        out('/CapHeight ' + font.metadata.capHeight);
        out('>>');
        out('endobj');
        var DescendantFont = newObject();
        out('<<');
        out('/Type /Font');
        out('/BaseFont /' + font.fontName);
        out('/FontDescriptor ' + fontDescriptor + ' 0 R');
        out('/W ' + jsPDF.API.PDFObject.convert(widths));
        out('/CIDToGIDMap /Identity');
        out('/DW 1000');
        out('/Subtype /CIDFontType2');
        out('/CIDSystemInfo');
        out('<<');
        out('/Supplement 0');
        out('/Registry (Adobe)');
        out('/Ordering (' + font.encoding + ')');
        out('>>');
        out('>>');
        out('endobj');
        font.objectNumber = newObject();
        out('<<');
        out('/Type /Font');
        out('/Subtype /Type0');
        out('/ToUnicode ' + cmap + ' 0 R');
        out('/BaseFont /' + font.fontName);
        out('/Encoding /' + font.encoding);
        out('/DescendantFonts [' + DescendantFont + ' 0 R]');
        out('>>');
        out('endobj');
        font.isAlreadyPutted = true;
      }
    };

    jsPDFAPI.events.push(['putFont', function (args) {
      identityHFunction(args.font, args.out, args.newObject, args.putStream);
    }]);

    var winAnsiEncodingFunction = function winAnsiEncodingFunction(font, out, newObject, putStream) {
      if (font.metadata instanceof jsPDF.API.TTFFont && font.encoding === 'WinAnsiEncoding') {
        //Tag with WinAnsi encoding
        var widths = font.metadata.Unicode.widths;
        var data = font.metadata.rawData;
        var pdfOutput = data;
        var pdfOutput2 = "";

        for (var i = 0; i < pdfOutput.length; i++) {
          pdfOutput2 += String.fromCharCode(pdfOutput[i]);
        }

        var fontTable = newObject();
        putStream({
          data: pdfOutput2,
          addLength1: true
        });
        out('endobj');
        var cmap = newObject();
        var cmapData = toUnicodeCmap(font.metadata.toUnicode);
        putStream({
          data: cmapData,
          addLength1: true
        });
        out('endobj');
        var fontDescriptor = newObject();
        out('<<');
        out('/Descent ' + font.metadata.decender);
        out('/CapHeight ' + font.metadata.capHeight);
        out('/StemV ' + font.metadata.stemV);
        out('/Type /FontDescriptor');
        out('/FontFile2 ' + fontTable + ' 0 R');
        out('/Flags 96');
        out('/FontBBox ' + jsPDF.API.PDFObject.convert(font.metadata.bbox));
        out('/FontName /' + font.fontName);
        out('/ItalicAngle ' + font.metadata.italicAngle);
        out('/Ascent ' + font.metadata.ascender);
        out('>>');
        out('endobj');
        font.objectNumber = newObject();

        for (var i = 0; i < font.metadata.hmtx.widths.length; i++) {
          font.metadata.hmtx.widths[i] = parseInt(font.metadata.hmtx.widths[i] * (1000 / font.metadata.head.unitsPerEm)); //Change the width of Em units to Point units.
        }

        out('<</Subtype/TrueType/Type/Font/ToUnicode ' + cmap + ' 0 R/BaseFont/' + font.fontName + '/FontDescriptor ' + fontDescriptor + ' 0 R' + '/Encoding/' + font.encoding + ' /FirstChar 29 /LastChar 255 /Widths ' + jsPDF.API.PDFObject.convert(font.metadata.hmtx.widths) + '>>');
        out('endobj');
        font.isAlreadyPutted = true;
      }
    };

    jsPDFAPI.events.push(['putFont', function (args) {
      winAnsiEncodingFunction(args.font, args.out, args.newObject, args.putStream);
    }]);

    var utf8TextFunction = function utf8TextFunction(args) {
      var text = args.text || '';
      var x = args.x;
      var y = args.y;
      var options = args.options || {};
      var mutex = args.mutex || {};
      var pdfEscape = mutex.pdfEscape;
      var activeFontKey = mutex.activeFontKey;
      var fonts = mutex.fonts;
      var key,
          fontSize = mutex.activeFontSize;
      var str = '',
          s = 0,
          cmapConfirm;
      var strText = '';
      var key = activeFontKey;
      var encoding = fonts[key].encoding;

      if (fonts[key].encoding !== 'Identity-H') {
        return {
          text: text,
          x: x,
          y: y,
          options: options,
          mutex: mutex
        };
      }
      strText = text;
      key = activeFontKey;

      if (Object.prototype.toString.call(text) === '[object Array]') {
        strText = text[0];
      }

      for (s = 0; s < strText.length; s += 1) {
        if (fonts[key].metadata.hasOwnProperty('cmap')) {
          cmapConfirm = fonts[key].metadata.cmap.unicode.codeMap[strText[s].charCodeAt(0)];
          /*
          if (Object.prototype.toString.call(text) === '[object Array]') {
            var i = 0;
           // for (i = 0; i < text.length; i += 1) {
                if (Object.prototype.toString.call(text[s]) === '[object Array]') {
                    cmapConfirm = fonts[key].metadata.cmap.unicode.codeMap[strText[s][0].charCodeAt(0)]; //Make sure the cmap has the corresponding glyph id
                } else {
                    
                }
            //}
            
          } else {
            cmapConfirm = fonts[key].metadata.cmap.unicode.codeMap[strText[s].charCodeAt(0)]; //Make sure the cmap has the corresponding glyph id
          }*/
        }

        if (!cmapConfirm) {
          if (strText[s].charCodeAt(0) < 256 && fonts[key].metadata.hasOwnProperty('Unicode')) {
            str += strText[s];
          } else {
            str += '';
          }
        } else {
          str += strText[s];
        }
      }

      var result = '';

      if (parseInt(key.slice(1)) < 14 || encoding === 'WinAnsiEncoding') {
        //For the default 13 font
        result = toHex(pdfEscape(str, key));
      } else if (encoding === 'Identity-H') {
        result = pdfEscape16(str, fonts[key]);
      }

      mutex.isHex = true;
      return {
        text: result,
        x: x,
        y: y,
        options: options,
        mutex: mutex
      };
    };

    var utf8EscapeFunction = function utf8EscapeFunction(parms) {
      var text = parms.text || '',
          x = parms.x,
          y = parms.y,
          options = parms.options,
          mutex = parms.mutex;
      var lang = options.lang;
      var tmpText = [];
      var args = {
        text: text,
        x: x,
        y: y,
        options: options,
        mutex: mutex
      };

      if (Object.prototype.toString.call(text) === '[object Array]') {
        var i = 0;

        for (i = 0; i < text.length; i += 1) {
          if (Object.prototype.toString.call(text[i]) === '[object Array]') {
            if (text[i].length === 3) {
              tmpText.push([utf8TextFunction(Object.assign({}, args, {
                text: text[i][0]
              })).text, text[i][1], text[i][2]]);
            } else {
              tmpText.push(utf8TextFunction(Object.assign({}, args, {
                text: text[i]
              })).text);
            }
          } else {
            tmpText.push(utf8TextFunction(Object.assign({}, args, {
              text: text[i]
            })).text);
          }
        }

        parms.text = tmpText;
      } else {
        parms.text = utf8TextFunction(Object.assign({}, args, {
          text: text
        })).text;
      }
    };

    jsPDFAPI.events.push(['postProcessText', utf8EscapeFunction]);
  })(jsPDF, typeof self !== "undefined" && self || typeof global !== "undefined" && global || typeof window !== "undefined" && window || Function("return this")());

  /**
   * jsPDF virtual FileSystem functionality
   *
   * Licensed under the MIT License.
   * http://opensource.org/licenses/mit-license
   */

  /**
  * Use the vFS to handle files
  * 
  * @name vFS
  * @module
  */
  (function (jsPDFAPI) {

    var _initializeVFS = function _initializeVFS(instance) {
      if (typeof instance === "undefined") {
        return false;
      }

      if (typeof instance.vFS === "undefined") {
        instance.vFS = {};
      }

      return true;
    };
    /** 
    * Check if the file exists in the vFS
    * 
    * @name existsFileInVFS
    * @function 
    * @param {string} Possible filename in the vFS.
    * @returns {boolean}
    * @example
    * doc.existsFileInVFS("someFile.txt");
    */


    jsPDFAPI.existsFileInVFS = function (filename) {
      if (_initializeVFS(this.internal)) {
        return typeof this.internal.vFS[filename] !== "undefined";
      }

      return false;
    };
    /**
    * Add a file to the vFS
    *
    * @name addFileToVFS
    * @function 
    * @param {string} filename The name of the file which should be added.
    * @param {string} filecontent The content of the file.
    * @returns {jsPDF}
    * @example
    * doc.addFileToVFS("someFile.txt", "BADFACE1");
    */


    jsPDFAPI.addFileToVFS = function (filename, filecontent) {
      _initializeVFS(this.internal);

      this.internal.vFS[filename] = filecontent;
      return this;
    };
    /** 
    * Get the file from the vFS
    * 
    * @name getFileFromVFS
    * @function 
    * @param {string} The name of the file which gets requested.
    * @returns {string} 
    * @example
    * doc.getFileFromVFS("someFile.txt");
    */


    jsPDFAPI.getFileFromVFS = function (filename) {
      _initializeVFS(this.internal);

      if (typeof this.internal.vFS[filename] !== "undefined") {
        return this.internal.vFS[filename];
      }

      return null;
    };
  })(jsPDF.API);

  /* Blob.js
   * A Blob, File, FileReader & URL implementation.
   * 2018-08-09
   *
   * By Eli Grey, http://eligrey.com
   * By Jimmy Wärting, https://github.com/jimmywarting
   * License: MIT
   *   See https://github.com/eligrey/Blob.js/blob/master/LICENSE.md
   */

  (function (global) {
    var BlobBuilder = global.BlobBuilder || global.WebKitBlobBuilder || global.MSBlobBuilder || global.MozBlobBuilder;

    global.URL = global.URL || global.webkitURL || function (href, a) {
      a = document.createElement('a');
      a.href = href;
      return a;
    };

    var origBlob = global.Blob;
    var createObjectURL = URL.createObjectURL;
    var revokeObjectURL = URL.revokeObjectURL;
    var strTag = global.Symbol && global.Symbol.toStringTag;
    var blobSupported = false;
    var blobSupportsArrayBufferView = false;
    var arrayBufferSupported = !!global.ArrayBuffer;
    var blobBuilderSupported = BlobBuilder && BlobBuilder.prototype.append && BlobBuilder.prototype.getBlob;

    try {
      // Check if Blob constructor is supported
      blobSupported = new Blob(['ä']).size === 2; // Check if Blob constructor supports ArrayBufferViews
      // Fails in Safari 6, so we need to map to ArrayBuffers there.

      blobSupportsArrayBufferView = new Blob([new Uint8Array([1, 2])]).size === 2;
    } catch (e) {}
    /**
     * Helper function that maps ArrayBufferViews to ArrayBuffers
     * Used by BlobBuilder constructor and old browsers that didn't
     * support it in the Blob constructor.
     */


    function mapArrayBufferViews(ary) {
      return ary.map(function (chunk) {
        if (chunk.buffer instanceof ArrayBuffer) {
          var buf = chunk.buffer; // if this is a subarray, make a copy so we only
          // include the subarray region from the underlying buffer

          if (chunk.byteLength !== buf.byteLength) {
            var copy = new Uint8Array(chunk.byteLength);
            copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
            buf = copy.buffer;
          }

          return buf;
        }

        return chunk;
      });
    }

    function BlobBuilderConstructor(ary, options) {
      options = options || {};
      var bb = new BlobBuilder();
      mapArrayBufferViews(ary).forEach(function (part) {
        bb.append(part);
      });
      return options.type ? bb.getBlob(options.type) : bb.getBlob();
    }

    function BlobConstructor(ary, options) {
      return new origBlob(mapArrayBufferViews(ary), options || {});
    }

    if (global.Blob) {
      BlobBuilderConstructor.prototype = Blob.prototype;
      BlobConstructor.prototype = Blob.prototype;
    }

    function FakeBlobBuilder() {
      function toUTF8Array(str) {
        var utf8 = [];

        for (var i = 0; i < str.length; i++) {
          var charcode = str.charCodeAt(i);
          if (charcode < 0x80) utf8.push(charcode);else if (charcode < 0x800) {
            utf8.push(0xc0 | charcode >> 6, 0x80 | charcode & 0x3f);
          } else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | charcode >> 12, 0x80 | charcode >> 6 & 0x3f, 0x80 | charcode & 0x3f);
          } // surrogate pair
          else {
              i++; // UTF-16 encodes 0x10000-0x10FFFF by
              // subtracting 0x10000 and splitting the
              // 20 bits of 0x0-0xFFFFF into two halves

              charcode = 0x10000 + ((charcode & 0x3ff) << 10 | str.charCodeAt(i) & 0x3ff);
              utf8.push(0xf0 | charcode >> 18, 0x80 | charcode >> 12 & 0x3f, 0x80 | charcode >> 6 & 0x3f, 0x80 | charcode & 0x3f);
            }
        }

        return utf8;
      }

      function fromUtf8Array(array) {
        var out, i, len, c;
        var char2, char3;
        out = "";
        len = array.length;
        i = 0;

        while (i < len) {
          c = array[i++];

          switch (c >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
              // 0xxxxxxx
              out += String.fromCharCode(c);
              break;

            case 12:
            case 13:
              // 110x xxxx   10xx xxxx
              char2 = array[i++];
              out += String.fromCharCode((c & 0x1F) << 6 | char2 & 0x3F);
              break;

            case 14:
              // 1110 xxxx  10xx xxxx  10xx xxxx
              char2 = array[i++];
              char3 = array[i++];
              out += String.fromCharCode((c & 0x0F) << 12 | (char2 & 0x3F) << 6 | (char3 & 0x3F) << 0);
              break;
          }
        }

        return out;
      }

      function isDataView(obj) {
        return obj && DataView.prototype.isPrototypeOf(obj);
      }

      function bufferClone(buf) {
        var view = new Array(buf.byteLength);
        var array = new Uint8Array(buf);
        var i = view.length;

        while (i--) {
          view[i] = array[i];
        }

        return view;
      }

      function encodeByteArray(input) {
        var byteToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var output = [];

        for (var i = 0; i < input.length; i += 3) {
          var byte1 = input[i];
          var haveByte2 = i + 1 < input.length;
          var byte2 = haveByte2 ? input[i + 1] : 0;
          var haveByte3 = i + 2 < input.length;
          var byte3 = haveByte3 ? input[i + 2] : 0;
          var outByte1 = byte1 >> 2;
          var outByte2 = (byte1 & 0x03) << 4 | byte2 >> 4;
          var outByte3 = (byte2 & 0x0F) << 2 | byte3 >> 6;
          var outByte4 = byte3 & 0x3F;

          if (!haveByte3) {
            outByte4 = 64;

            if (!haveByte2) {
              outByte3 = 64;
            }
          }

          output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
        }

        return output.join('');
      }

      var create = Object.create || function (a) {
        function c() {}

        c.prototype = a;
        return new c();
      };

      if (arrayBufferSupported) {
        var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]'];

        var isArrayBufferView = ArrayBuffer.isView || function (obj) {
          return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
        };
      }
      /********************************************************/

      /*                   Blob constructor                   */

      /********************************************************/


      function Blob(chunks, opts) {
        chunks = chunks || [];

        for (var i = 0, len = chunks.length; i < len; i++) {
          var chunk = chunks[i];

          if (chunk instanceof Blob) {
            chunks[i] = chunk._buffer;
          } else if (typeof chunk === 'string') {
            chunks[i] = toUTF8Array(chunk);
          } else if (arrayBufferSupported && (ArrayBuffer.prototype.isPrototypeOf(chunk) || isArrayBufferView(chunk))) {
            chunks[i] = bufferClone(chunk);
          } else if (arrayBufferSupported && isDataView(chunk)) {
            chunks[i] = bufferClone(chunk.buffer);
          } else {
            chunks[i] = toUTF8Array(String(chunk));
          }
        }

        this._buffer = [].concat.apply([], chunks);
        this.size = this._buffer.length;
        this.type = opts ? opts.type || '' : '';
      }

      Blob.prototype.slice = function (start, end, type) {
        var slice = this._buffer.slice(start || 0, end || this._buffer.length);

        return new Blob([slice], {
          type: type
        });
      };

      Blob.prototype.toString = function () {
        return '[object Blob]';
      };
      /********************************************************/

      /*                   File constructor                   */

      /********************************************************/


      function File(chunks, name, opts) {
        opts = opts || {};
        var a = Blob.call(this, chunks, opts) || this;
        a.name = name;
        a.lastModifiedDate = opts.lastModified ? new Date(opts.lastModified) : new Date();
        a.lastModified = +a.lastModifiedDate;
        return a;
      }

      File.prototype = create(Blob.prototype);
      File.prototype.constructor = File;
      if (Object.setPrototypeOf) Object.setPrototypeOf(File, Blob);else {
        try {
          File.__proto__ = Blob;
        } catch (e) {}
      }

      File.prototype.toString = function () {
        return '[object File]';
      };
      /********************************************************/

      /*                FileReader constructor                */

      /********************************************************/


      function FileReader() {
        if (!(this instanceof FileReader)) throw new TypeError("Failed to construct 'FileReader': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        var delegate = document.createDocumentFragment();
        this.addEventListener = delegate.addEventListener;

        this.dispatchEvent = function (evt) {
          var local = this['on' + evt.type];
          if (typeof local === 'function') local(evt);
          delegate.dispatchEvent(evt);
        };

        this.removeEventListener = delegate.removeEventListener;
      }

      function _read(fr, blob, kind) {
        if (!(blob instanceof Blob)) throw new TypeError("Failed to execute '" + kind + "' on 'FileReader': parameter 1 is not of type 'Blob'.");
        fr.result = '';
        setTimeout(function () {
          this.readyState = FileReader.LOADING;
          fr.dispatchEvent(new Event('load'));
          fr.dispatchEvent(new Event('loadend'));
        });
      }

      FileReader.EMPTY = 0;
      FileReader.LOADING = 1;
      FileReader.DONE = 2;
      FileReader.prototype.error = null;
      FileReader.prototype.onabort = null;
      FileReader.prototype.onerror = null;
      FileReader.prototype.onload = null;
      FileReader.prototype.onloadend = null;
      FileReader.prototype.onloadstart = null;
      FileReader.prototype.onprogress = null;

      FileReader.prototype.readAsDataURL = function (blob) {
        _read(this, blob, 'readAsDataURL');

        this.result = 'data:' + blob.type + ';base64,' + encodeByteArray(blob._buffer);
      };

      FileReader.prototype.readAsText = function (blob) {
        _read(this, blob, 'readAsText');

        this.result = fromUtf8Array(blob._buffer);
      };

      FileReader.prototype.readAsArrayBuffer = function (blob) {
        _read(this, blob, 'readAsText');

        this.result = blob._buffer.slice();
      };

      FileReader.prototype.abort = function () {};
      /********************************************************/

      /*                         URL                          */

      /********************************************************/


      URL.createObjectURL = function (blob) {
        return blob instanceof Blob ? 'data:' + blob.type + ';base64,' + encodeByteArray(blob._buffer) : createObjectURL.call(URL, blob);
      };

      URL.revokeObjectURL = function (url) {
        revokeObjectURL && revokeObjectURL.call(URL, url);
      };
      /********************************************************/

      /*                         XHR                          */

      /********************************************************/


      var _send = global.XMLHttpRequest && global.XMLHttpRequest.prototype.send;

      if (_send) {
        XMLHttpRequest.prototype.send = function (data) {
          if (data instanceof Blob) {
            this.setRequestHeader('Content-Type', data.type);

            _send.call(this, fromUtf8Array(data._buffer));
          } else {
            _send.call(this, data);
          }
        };
      }

      global.FileReader = FileReader;
      global.File = File;
      global.Blob = Blob;
    }

    if (strTag) {
      try {
        File.prototype[strTag] = 'File';
        Blob.prototype[strTag] = 'Blob';
        FileReader.prototype[strTag] = 'FileReader';
      } catch (e) {}
    }

    function fixFileAndXHR() {
      var isIE = !!global.ActiveXObject || '-ms-scroll-limit' in document.documentElement.style && '-ms-ime-align' in document.documentElement.style; // Monkey patched 
      // IE don't set Content-Type header on XHR whose body is a typed Blob
      // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/6047383

      var _send = global.XMLHttpRequest && global.XMLHttpRequest.prototype.send;

      if (isIE && _send) {
        XMLHttpRequest.prototype.send = function (data) {
          if (data instanceof Blob) {
            this.setRequestHeader('Content-Type', data.type);

            _send.call(this, data);
          } else {
            _send.call(this, data);
          }
        };
      }

      try {
        new File([], '');
      } catch (e) {
        try {
          var klass = new Function('class File extends Blob {' + 'constructor(chunks, name, opts) {' + 'opts = opts || {};' + 'super(chunks, opts || {});' + 'this.name = name;' + 'this.lastModifiedDate = opts.lastModified ? new Date(opts.lastModified) : new Date;' + 'this.lastModified = +this.lastModifiedDate;' + '}};' + 'return new File([], ""), File')();
          global.File = klass;
        } catch (e) {
          var klass = function klass(b, d, c) {
            var blob = new Blob(b, c);
            var t = c && void 0 !== c.lastModified ? new Date(c.lastModified) : new Date();
            blob.name = d;
            blob.lastModifiedDate = t;
            blob.lastModified = +t;

            blob.toString = function () {
              return '[object File]';
            };

            if (strTag) blob[strTag] = 'File';
            return blob;
          };

          global.File = klass;
        }
      }
    }

    if (blobSupported) {
      fixFileAndXHR();
      global.Blob = blobSupportsArrayBufferView ? global.Blob : BlobConstructor;
    } else if (blobBuilderSupported) {
      fixFileAndXHR();
      global.Blob = BlobBuilderConstructor;
    } else {
      FakeBlobBuilder();
    }
  })(typeof self !== "undefined" && self || typeof window !== "undefined" && window || typeof global !== "undefined" && global || Function('return typeof this === "object" && this.content')() || Function('return this')());

  /* FileSaver.js
   * A saveAs() FileSaver implementation.
   * 1.3.8
   * 2018-03-22 14:03:47
   *
   * By Eli Grey, https://eligrey.com
   * License: MIT
   *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
   */

  /*global self */

  /*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

  /*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/src/FileSaver.js */
  var saveAs = saveAs || function (view) {

    if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
      return;
    }

    var doc = view.document // only get URL when necessary in case Blob.js hasn't overridden it yet
    ,
        get_URL = function () {
      return view.URL || view.webkitURL || view;
    },
        save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
        can_use_save_link = "download" in save_link,
        click = function (node) {
      var event = new MouseEvent("click");
      node.dispatchEvent(event);
    },
        is_safari = /constructor/i.test(view.HTMLElement) || view.safari,
        is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent),
        setImmediate = view.setImmediate || view.setTimeout,
        throw_outside = function (ex) {
      setImmediate(function () {
        throw ex;
      }, 0);
    },
        force_saveable_type = "application/octet-stream" // the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
    ,
        arbitrary_revoke_timeout = 1000 * 40 // in ms
    ,
        revoke = function (file) {
      var revoker = function () {
        if (typeof file === "string") {
          // file is an object URL
          get_URL().revokeObjectURL(file);
        } else {
          // file is a File
          file.remove();
        }
      };

      setTimeout(revoker, arbitrary_revoke_timeout);
    },
        dispatch = function (filesaver, event_types, event) {
      event_types = [].concat(event_types);
      var i = event_types.length;

      while (i--) {
        var listener = filesaver["on" + event_types[i]];

        if (typeof listener === "function") {
          try {
            listener.call(filesaver, event || filesaver);
          } catch (ex) {
            throw_outside(ex);
          }
        }
      }
    },
        auto_bom = function (blob) {
      // prepend BOM for UTF-8 XML and text/* types (including HTML)
      // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
      if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
        return new Blob([String.fromCharCode(0xFEFF), blob], {
          type: blob.type
        });
      }

      return blob;
    },
        FileSaver = function (blob, name, no_auto_bom) {
      if (!no_auto_bom) {
        blob = auto_bom(blob);
      } // First try a.download, then web filesystem, then object URLs


      var filesaver = this,
          type = blob.type,
          force = type === force_saveable_type,
          object_url,
          dispatch_all = function () {
        dispatch(filesaver, "writestart progress write writeend".split(" "));
      } // on any filesys errors revert to saving with object URLs
      ,
          fs_error = function () {
        if ((is_chrome_ios || force && is_safari) && view.FileReader) {
          // Safari doesn't allow downloading of blob urls
          var reader = new FileReader();

          reader.onloadend = function () {
            var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
            var popup = view.open(url, '_blank');
            if (!popup) view.location.href = url;
            url = undefined; // release reference before dispatching

            filesaver.readyState = filesaver.DONE;
            dispatch_all();
          };

          reader.readAsDataURL(blob);
          filesaver.readyState = filesaver.INIT;
          return;
        } // don't create more object URLs than needed


        if (!object_url) {
          object_url = get_URL().createObjectURL(blob);
        }

        if (force) {
          view.location.href = object_url;
        } else {
          var opened = view.open(object_url, "_blank");

          if (!opened) {
            // Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
            view.location.href = object_url;
          }
        }

        filesaver.readyState = filesaver.DONE;
        dispatch_all();
        revoke(object_url);
      };

      filesaver.readyState = filesaver.INIT;

      if (can_use_save_link) {
        object_url = get_URL().createObjectURL(blob);
        setImmediate(function () {
          save_link.href = object_url;
          save_link.download = name;
          click(save_link);
          dispatch_all();
          revoke(object_url);
          filesaver.readyState = filesaver.DONE;
        }, 0);
        return;
      }

      fs_error();
    },
        FS_proto = FileSaver.prototype,
        saveAs = function (blob, name, no_auto_bom) {
      return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
    }; // IE 10+ (native saveAs)


    if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
      return function (blob, name, no_auto_bom) {
        name = name || blob.name || "download";

        if (!no_auto_bom) {
          blob = auto_bom(blob);
        }

        return navigator.msSaveOrOpenBlob(blob, name);
      };
    } // todo: detect chrome extensions & packaged apps
    //save_link.target = "_blank";


    FS_proto.abort = function () {};

    FS_proto.readyState = FS_proto.INIT = 0;
    FS_proto.WRITING = 1;
    FS_proto.DONE = 2;
    FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null;
    return saveAs;
  }(typeof self !== "undefined" && self || typeof window !== "undefined" && window || undefined);

  /*
   * Copyright (c) 2012 chick307 <chick307@gmail.com>
   *
   * Licensed under the MIT License.
   * http://opensource.org/licenses/mit-license
   */
  (function (jsPDF, callback) {
    jsPDF.API.adler32cs = callback();
  })(jsPDF, function () {
    var _hasArrayBuffer = typeof ArrayBuffer === 'function' && typeof Uint8Array === 'function';

    var _Buffer = null,
        _isBuffer = function () {
      if (!_hasArrayBuffer) return function _isBuffer() {
        return false;
      };

      try {
        var buffer = {};
        if (typeof buffer.Buffer === 'function') _Buffer = buffer.Buffer;
      } catch (error) {}

      return function _isBuffer(value) {
        return value instanceof ArrayBuffer || _Buffer !== null && value instanceof _Buffer;
      };
    }();

    var _utf8ToBinary = function () {
      if (_Buffer !== null) {
        return function _utf8ToBinary(utf8String) {
          return new _Buffer(utf8String, 'utf8').toString('binary');
        };
      } else {
        return function _utf8ToBinary(utf8String) {
          return unescape(encodeURIComponent(utf8String));
        };
      }
    }();

    var MOD = 65521;

    var _update = function _update(checksum, binaryString) {
      var a = checksum & 0xFFFF,
          b = checksum >>> 16;

      for (var i = 0, length = binaryString.length; i < length; i++) {
        a = (a + (binaryString.charCodeAt(i) & 0xFF)) % MOD;
        b = (b + a) % MOD;
      }

      return (b << 16 | a) >>> 0;
    };

    var _updateUint8Array = function _updateUint8Array(checksum, uint8Array) {
      var a = checksum & 0xFFFF,
          b = checksum >>> 16;

      for (var i = 0, length = uint8Array.length; i < length; i++) {
        a = (a + uint8Array[i]) % MOD;
        b = (b + a) % MOD;
      }

      return (b << 16 | a) >>> 0;
    };

    var exports = {};

    var Adler32 = exports.Adler32 = function () {
      var ctor = function Adler32(checksum) {
        if (!(this instanceof ctor)) {
          throw new TypeError('Constructor cannot called be as a function.');
        }

        if (!isFinite(checksum = checksum == null ? 1 : +checksum)) {
          throw new Error('First arguments needs to be a finite number.');
        }

        this.checksum = checksum >>> 0;
      };

      var proto = ctor.prototype = {};
      proto.constructor = ctor;

      ctor.from = function (from) {
        from.prototype = proto;
        return from;
      }(function from(binaryString) {
        if (!(this instanceof ctor)) {
          throw new TypeError('Constructor cannot called be as a function.');
        }

        if (binaryString == null) throw new Error('First argument needs to be a string.');
        this.checksum = _update(1, binaryString.toString());
      });

      ctor.fromUtf8 = function (fromUtf8) {
        fromUtf8.prototype = proto;
        return fromUtf8;
      }(function fromUtf8(utf8String) {
        if (!(this instanceof ctor)) {
          throw new TypeError('Constructor cannot called be as a function.');
        }

        if (utf8String == null) throw new Error('First argument needs to be a string.');

        var binaryString = _utf8ToBinary(utf8String.toString());

        this.checksum = _update(1, binaryString);
      });

      if (_hasArrayBuffer) {
        ctor.fromBuffer = function (fromBuffer) {
          fromBuffer.prototype = proto;
          return fromBuffer;
        }(function fromBuffer(buffer) {
          if (!(this instanceof ctor)) {
            throw new TypeError('Constructor cannot called be as a function.');
          }

          if (!_isBuffer(buffer)) throw new Error('First argument needs to be ArrayBuffer.');
          var array = new Uint8Array(buffer);
          return this.checksum = _updateUint8Array(1, array);
        });
      }

      proto.update = function update(binaryString) {
        if (binaryString == null) throw new Error('First argument needs to be a string.');
        binaryString = binaryString.toString();
        return this.checksum = _update(this.checksum, binaryString);
      };

      proto.updateUtf8 = function updateUtf8(utf8String) {
        if (utf8String == null) throw new Error('First argument needs to be a string.');

        var binaryString = _utf8ToBinary(utf8String.toString());

        return this.checksum = _update(this.checksum, binaryString);
      };

      if (_hasArrayBuffer) {
        proto.updateBuffer = function updateBuffer(buffer) {
          if (!_isBuffer(buffer)) throw new Error('First argument needs to be ArrayBuffer.');
          var array = new Uint8Array(buffer);
          return this.checksum = _updateUint8Array(this.checksum, array);
        };
      }

      proto.clone = function clone() {
        return new Adler32(this.checksum);
      };

      return ctor;
    }();

    exports.from = function from(binaryString) {
      if (binaryString == null) throw new Error('First argument needs to be a string.');
      return _update(1, binaryString.toString());
    };

    exports.fromUtf8 = function fromUtf8(utf8String) {
      if (utf8String == null) throw new Error('First argument needs to be a string.');

      var binaryString = _utf8ToBinary(utf8String.toString());

      return _update(1, binaryString);
    };

    if (_hasArrayBuffer) {
      exports.fromBuffer = function fromBuffer(buffer) {
        if (!_isBuffer(buffer)) throw new Error('First argument need to be ArrayBuffer.');
        var array = new Uint8Array(buffer);
        return _updateUint8Array(1, array);
      };
    }

    return exports;
  });

  /**
   * A class to parse color values
   * @author Stoyan Stefanov <sstoo@gmail.com>
   * {@link   http://www.phpied.com/rgb-color-parser-in-javascript/}
   * @license Use it if you like it
   */
  (function (global) {

    function RGBColor(color_string) {
      color_string = color_string || '';
      this.ok = false; // strip any leading #

      if (color_string.charAt(0) == '#') {
        // remove # if any
        color_string = color_string.substr(1, 6);
      }

      color_string = color_string.replace(/ /g, '');
      color_string = color_string.toLowerCase();
      var channels; // before getting into regexps, try simple matches
      // and overwrite the input

      var simple_colors = {
        aliceblue: 'f0f8ff',
        antiquewhite: 'faebd7',
        aqua: '00ffff',
        aquamarine: '7fffd4',
        azure: 'f0ffff',
        beige: 'f5f5dc',
        bisque: 'ffe4c4',
        black: '000000',
        blanchedalmond: 'ffebcd',
        blue: '0000ff',
        blueviolet: '8a2be2',
        brown: 'a52a2a',
        burlywood: 'deb887',
        cadetblue: '5f9ea0',
        chartreuse: '7fff00',
        chocolate: 'd2691e',
        coral: 'ff7f50',
        cornflowerblue: '6495ed',
        cornsilk: 'fff8dc',
        crimson: 'dc143c',
        cyan: '00ffff',
        darkblue: '00008b',
        darkcyan: '008b8b',
        darkgoldenrod: 'b8860b',
        darkgray: 'a9a9a9',
        darkgreen: '006400',
        darkkhaki: 'bdb76b',
        darkmagenta: '8b008b',
        darkolivegreen: '556b2f',
        darkorange: 'ff8c00',
        darkorchid: '9932cc',
        darkred: '8b0000',
        darksalmon: 'e9967a',
        darkseagreen: '8fbc8f',
        darkslateblue: '483d8b',
        darkslategray: '2f4f4f',
        darkturquoise: '00ced1',
        darkviolet: '9400d3',
        deeppink: 'ff1493',
        deepskyblue: '00bfff',
        dimgray: '696969',
        dodgerblue: '1e90ff',
        feldspar: 'd19275',
        firebrick: 'b22222',
        floralwhite: 'fffaf0',
        forestgreen: '228b22',
        fuchsia: 'ff00ff',
        gainsboro: 'dcdcdc',
        ghostwhite: 'f8f8ff',
        gold: 'ffd700',
        goldenrod: 'daa520',
        gray: '808080',
        green: '008000',
        greenyellow: 'adff2f',
        honeydew: 'f0fff0',
        hotpink: 'ff69b4',
        indianred: 'cd5c5c',
        indigo: '4b0082',
        ivory: 'fffff0',
        khaki: 'f0e68c',
        lavender: 'e6e6fa',
        lavenderblush: 'fff0f5',
        lawngreen: '7cfc00',
        lemonchiffon: 'fffacd',
        lightblue: 'add8e6',
        lightcoral: 'f08080',
        lightcyan: 'e0ffff',
        lightgoldenrodyellow: 'fafad2',
        lightgrey: 'd3d3d3',
        lightgreen: '90ee90',
        lightpink: 'ffb6c1',
        lightsalmon: 'ffa07a',
        lightseagreen: '20b2aa',
        lightskyblue: '87cefa',
        lightslateblue: '8470ff',
        lightslategray: '778899',
        lightsteelblue: 'b0c4de',
        lightyellow: 'ffffe0',
        lime: '00ff00',
        limegreen: '32cd32',
        linen: 'faf0e6',
        magenta: 'ff00ff',
        maroon: '800000',
        mediumaquamarine: '66cdaa',
        mediumblue: '0000cd',
        mediumorchid: 'ba55d3',
        mediumpurple: '9370d8',
        mediumseagreen: '3cb371',
        mediumslateblue: '7b68ee',
        mediumspringgreen: '00fa9a',
        mediumturquoise: '48d1cc',
        mediumvioletred: 'c71585',
        midnightblue: '191970',
        mintcream: 'f5fffa',
        mistyrose: 'ffe4e1',
        moccasin: 'ffe4b5',
        navajowhite: 'ffdead',
        navy: '000080',
        oldlace: 'fdf5e6',
        olive: '808000',
        olivedrab: '6b8e23',
        orange: 'ffa500',
        orangered: 'ff4500',
        orchid: 'da70d6',
        palegoldenrod: 'eee8aa',
        palegreen: '98fb98',
        paleturquoise: 'afeeee',
        palevioletred: 'd87093',
        papayawhip: 'ffefd5',
        peachpuff: 'ffdab9',
        peru: 'cd853f',
        pink: 'ffc0cb',
        plum: 'dda0dd',
        powderblue: 'b0e0e6',
        purple: '800080',
        red: 'ff0000',
        rosybrown: 'bc8f8f',
        royalblue: '4169e1',
        saddlebrown: '8b4513',
        salmon: 'fa8072',
        sandybrown: 'f4a460',
        seagreen: '2e8b57',
        seashell: 'fff5ee',
        sienna: 'a0522d',
        silver: 'c0c0c0',
        skyblue: '87ceeb',
        slateblue: '6a5acd',
        slategray: '708090',
        snow: 'fffafa',
        springgreen: '00ff7f',
        steelblue: '4682b4',
        tan: 'd2b48c',
        teal: '008080',
        thistle: 'd8bfd8',
        tomato: 'ff6347',
        turquoise: '40e0d0',
        violet: 'ee82ee',
        violetred: 'd02090',
        wheat: 'f5deb3',
        white: 'ffffff',
        whitesmoke: 'f5f5f5',
        yellow: 'ffff00',
        yellowgreen: '9acd32'
      };

      for (var key in simple_colors) {
        if (color_string == key) {
          color_string = simple_colors[key];
        }
      } // emd of simple type-in colors
      // array of color definition objects


      var color_defs = [{
        re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
        example: ['rgb(123, 234, 45)', 'rgb(255,234,245)'],
        process: function process(bits) {
          return [parseInt(bits[1]), parseInt(bits[2]), parseInt(bits[3])];
        }
      }, {
        re: /^(\w{2})(\w{2})(\w{2})$/,
        example: ['#00ff00', '336699'],
        process: function process(bits) {
          return [parseInt(bits[1], 16), parseInt(bits[2], 16), parseInt(bits[3], 16)];
        }
      }, {
        re: /^(\w{1})(\w{1})(\w{1})$/,
        example: ['#fb0', 'f0f'],
        process: function process(bits) {
          return [parseInt(bits[1] + bits[1], 16), parseInt(bits[2] + bits[2], 16), parseInt(bits[3] + bits[3], 16)];
        }
      }]; // search through the definitions to find a match

      for (var i = 0; i < color_defs.length; i++) {
        var re = color_defs[i].re;
        var processor = color_defs[i].process;
        var bits = re.exec(color_string);

        if (bits) {
          channels = processor(bits);
          this.r = channels[0];
          this.g = channels[1];
          this.b = channels[2];
          this.ok = true;
        }
      } // validate/cleanup values


      this.r = this.r < 0 || isNaN(this.r) ? 0 : this.r > 255 ? 255 : this.r;
      this.g = this.g < 0 || isNaN(this.g) ? 0 : this.g > 255 ? 255 : this.g;
      this.b = this.b < 0 || isNaN(this.b) ? 0 : this.b > 255 ? 255 : this.b; // some getters

      this.toRGB = function () {
        return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
      };

      this.toHex = function () {
        var r = this.r.toString(16);
        var g = this.g.toString(16);
        var b = this.b.toString(16);
        if (r.length == 1) r = '0' + r;
        if (g.length == 1) g = '0' + g;
        if (b.length == 1) b = '0' + b;
        return '#' + r + g + b;
      };
    }

    global.RGBColor = RGBColor;
  })(typeof self !== "undefined" && self || typeof window !== "undefined" && window || typeof global !== "undefined" && global || Function('return typeof this === "object" && this.content')() || Function('return this')()); // `self` is undefined in Firefox for Android content script context
  // while `this` is nsIContentFrameMessageManager
  // with an attribute `content` that corresponds to the window

  /**
  * Unicode Bidi Engine based on the work of Alex Shensis (@asthensis)
  * MIT License
  */
  (function (jsPDF) {
    /**
     * Table of Unicode types.
     *
     * Generated by:
     *
     * var bidi = require("./bidi/index");
     * var bidi_accumulate = bidi.slice(0, 256).concat(bidi.slice(0x0500, 0x0500 + 256 * 3)).
     * concat(bidi.slice(0x2000, 0x2000 + 256)).concat(bidi.slice(0xFB00, 0xFB00 + 256)).
     * concat(bidi.slice(0xFE00, 0xFE00 + 2 * 256));
     *
     * for( var i = 0; i < bidi_accumulate.length; i++) {
     * 	if(bidi_accumulate[i] === undefined || bidi_accumulate[i] === 'ON')
     * 		bidi_accumulate[i] = 'N'; //mark as neutral to conserve space and substitute undefined
     * }
     * var bidiAccumulateStr = 'return [ "' + bidi_accumulate.toString().replace(/,/g, '", "') + '" ];';
     * require("fs").writeFile('unicode-types.js', bidiAccumulateStr);
     *
     * Based on:
     * https://github.com/mathiasbynens/unicode-8.0.0
     */

    var bidiUnicodeTypes = ["BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "S", "B", "S", "WS", "B", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "B", "B", "B", "S", "WS", "N", "N", "ET", "ET", "ET", "N", "N", "N", "N", "N", "ES", "CS", "ES", "CS", "CS", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "CS", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "N", "BN", "BN", "BN", "BN", "BN", "BN", "B", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "CS", "N", "ET", "ET", "ET", "ET", "N", "N", "N", "N", "L", "N", "N", "BN", "N", "N", "ET", "ET", "EN", "EN", "N", "L", "N", "N", "N", "EN", "L", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "L", "L", "L", "L", "L", "L", "L", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "L", "N", "N", "N", "N", "N", "ET", "N", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "R", "NSM", "R", "NSM", "NSM", "R", "NSM", "NSM", "R", "NSM", "N", "N", "N", "N", "N", "N", "N", "N", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "N", "N", "N", "N", "N", "R", "R", "R", "R", "R", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "AN", "AN", "AN", "AN", "AN", "AN", "N", "N", "AL", "ET", "ET", "AL", "CS", "AL", "N", "N", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AL", "AL", "N", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "ET", "AN", "AN", "AL", "AL", "AL", "NSM", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AN", "N", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AL", "AL", "NSM", "NSM", "N", "NSM", "NSM", "NSM", "NSM", "AL", "AL", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "N", "AL", "AL", "NSM", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "N", "N", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AL", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "R", "R", "N", "N", "N", "N", "R", "N", "N", "N", "N", "N", "WS", "WS", "WS", "WS", "WS", "WS", "WS", "WS", "WS", "WS", "WS", "BN", "BN", "BN", "L", "R", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "WS", "B", "LRE", "RLE", "PDF", "LRO", "RLO", "CS", "ET", "ET", "ET", "ET", "ET", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "CS", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "WS", "BN", "BN", "BN", "BN", "BN", "N", "LRI", "RLI", "FSI", "PDI", "BN", "BN", "BN", "BN", "BN", "BN", "EN", "L", "N", "N", "EN", "EN", "EN", "EN", "EN", "EN", "ES", "ES", "N", "N", "N", "L", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "ES", "ES", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "N", "N", "N", "N", "N", "R", "NSM", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "ES", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "N", "R", "R", "R", "R", "R", "N", "R", "N", "R", "R", "N", "R", "R", "N", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "CS", "N", "CS", "N", "N", "CS", "N", "N", "N", "N", "N", "N", "N", "N", "N", "ET", "N", "N", "ES", "ES", "N", "N", "N", "N", "N", "ET", "ET", "N", "N", "N", "N", "N", "AL", "AL", "AL", "AL", "AL", "N", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "N", "N", "BN", "N", "N", "N", "ET", "ET", "ET", "N", "N", "N", "N", "N", "ES", "CS", "ES", "CS", "CS", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "CS", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "L", "L", "L", "L", "L", "L", "N", "N", "L", "L", "L", "L", "L", "L", "N", "N", "L", "L", "L", "L", "L", "L", "N", "N", "L", "L", "L", "N", "N", "N", "ET", "ET", "N", "N", "N", "ET", "ET", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N"];
    /**
     * Unicode Bidi algorithm compliant Bidi engine.
     * For reference see http://unicode.org/reports/tr9/
    */

    /**
     * constructor ( options )
     *
     * Initializes Bidi engine
     *
     * @param {Object} See 'setOptions' below for detailed description.
     * options are cashed between invocation of 'doBidiReorder' method
     *
     * sample usage pattern of BidiEngine:
     * var opt = {
     * 	isInputVisual: true,
     * 	isInputRtl: false,
     * 	isOutputVisual: false,
     * 	isOutputRtl: false,
     * 	isSymmetricSwapping: true
     * }
     * var sourceToTarget = [], levels = [];
     * var bidiEng = Globalize.bidiEngine(opt);
     * var src = "text string to be reordered";
     * var ret = bidiEng.doBidiReorder(src, sourceToTarget, levels);
     */

    jsPDF.__bidiEngine__ = jsPDF.prototype.__bidiEngine__ = function (options) {
      var _UNICODE_TYPES = _bidiUnicodeTypes;
      var _STATE_TABLE_LTR = [[0, 3, 0, 1, 0, 0, 0], [0, 3, 0, 1, 2, 2, 0], [0, 3, 0, 0x11, 2, 0, 1], [0, 3, 5, 5, 4, 1, 0], [0, 3, 0x15, 0x15, 4, 0, 1], [0, 3, 5, 5, 4, 2, 0]];
      var _STATE_TABLE_RTL = [[2, 0, 1, 1, 0, 1, 0], [2, 0, 1, 1, 0, 2, 0], [2, 0, 2, 1, 3, 2, 0], [2, 0, 2, 0x21, 3, 1, 1]];
      var _TYPE_NAMES_MAP = {
        "L": 0,
        "R": 1,
        "EN": 2,
        "AN": 3,
        "N": 4,
        "B": 5,
        "S": 6
      };
      var _UNICODE_RANGES_MAP = {
        0: 0,
        5: 1,
        6: 2,
        7: 3,
        0x20: 4,
        0xFB: 5,
        0xFE: 6,
        0xFF: 7
      };
      var _SWAP_TABLE = ["(", ")", "(", "<", ">", "<", "[", "]", "[", "{", "}", "{", "\xAB", "\xBB", "\xAB", "\u2039", "\u203A", "\u2039", "\u2045", "\u2046", "\u2045", "\u207D", "\u207E", "\u207D", "\u208D", "\u208E", "\u208D", "\u2264", "\u2265", "\u2264", "\u2329", "\u232A", "\u2329", "\uFE59", "\uFE5A", "\uFE59", "\uFE5B", "\uFE5C", "\uFE5B", "\uFE5D", "\uFE5E", "\uFE5D", "\uFE64", "\uFE65", "\uFE64"];

      var _LTR_RANGES_REG_EXPR = new RegExp(/^([1-4|9]|1[0-9]|2[0-9]|3[0168]|4[04589]|5[012]|7[78]|159|16[0-9]|17[0-2]|21[569]|22[03489]|250)$/);

      var _lastArabic = false,
          _hasUbatB,
          _hasUbatS,
          DIR_LTR = 0,
          DIR_RTL = 1,
          _isInVisual,
          _isInRtl,
          _isOutVisual,
          _isOutRtl,
          _isSymmetricSwapping,
          _dir = DIR_LTR;

      this.__bidiEngine__ = {};

      var _init = function _init(text, sourceToTargetMap) {
        if (sourceToTargetMap) {
          for (var i = 0; i < text.length; i++) {
            sourceToTargetMap[i] = i;
          }
        }

        if (_isInRtl === undefined) {
          _isInRtl = _isContextualDirRtl(text);
        }

        if (_isOutRtl === undefined) {
          _isOutRtl = _isContextualDirRtl(text);
        }
      }; // for reference see 3.2 in http://unicode.org/reports/tr9/
      //


      var _getCharType = function _getCharType(ch) {
        var charCode = ch.charCodeAt(),
            range = charCode >> 8,
            rangeIdx = _UNICODE_RANGES_MAP[range];

        if (rangeIdx !== undefined) {
          return _UNICODE_TYPES[rangeIdx * 256 + (charCode & 0xFF)];
        } else if (range === 0xFC || range === 0xFD) {
          return "AL";
        } else if (_LTR_RANGES_REG_EXPR.test(range)) {
          //unlikely case
          return "L";
        } else if (range === 8) {
          // even less likely
          return "R";
        }

        return "N"; //undefined type, mark as neutral
      };

      var _isContextualDirRtl = function _isContextualDirRtl(text) {
        for (var i = 0, charType; i < text.length; i++) {
          charType = _getCharType(text.charAt(i));

          if (charType === "L") {
            return false;
          } else if (charType === "R") {
            return true;
          }
        }

        return false;
      }; // for reference see 3.3.4 & 3.3.5 in http://unicode.org/reports/tr9/
      //


      var _resolveCharType = function _resolveCharType(chars, types, resolvedTypes, index) {
        var cType = types[index],
            wType,
            nType,
            i,
            len;

        switch (cType) {
          case "L":
          case "R":
            _lastArabic = false;
            break;

          case "N":
          case "AN":
            break;

          case "EN":
            if (_lastArabic) {
              cType = "AN";
            }

            break;

          case "AL":
            _lastArabic = true;
            cType = "R";
            break;

          case "WS":
            cType = "N";
            break;

          case "CS":
            if (index < 1 || index + 1 >= types.length || (wType = resolvedTypes[index - 1]) !== "EN" && wType !== "AN" || (nType = types[index + 1]) !== "EN" && nType !== "AN") {
              cType = "N";
            } else if (_lastArabic) {
              nType = "AN";
            }

            cType = nType === wType ? nType : "N";
            break;

          case "ES":
            wType = index > 0 ? resolvedTypes[index - 1] : "B";
            cType = wType === "EN" && index + 1 < types.length && types[index + 1] === "EN" ? "EN" : "N";
            break;

          case "ET":
            if (index > 0 && resolvedTypes[index - 1] === "EN") {
              cType = "EN";
              break;
            } else if (_lastArabic) {
              cType = "N";
              break;
            }

            i = index + 1;
            len = types.length;

            while (i < len && types[i] === "ET") {
              i++;
            }

            if (i < len && types[i] === "EN") {
              cType = "EN";
            } else {
              cType = "N";
            }

            break;

          case "NSM":
            if (_isInVisual && !_isInRtl) {
              //V->L
              len = types.length;
              i = index + 1;

              while (i < len && types[i] === "NSM") {
                i++;
              }

              if (i < len) {
                var c = chars[index];
                var rtlCandidate = c >= 0x0591 && c <= 0x08FF || c === 0xFB1E;
                wType = types[i];

                if (rtlCandidate && (wType === "R" || wType === "AL")) {
                  cType = "R";
                  break;
                }
              }
            }

            if (index < 1 || (wType = types[index - 1]) === "B") {
              cType = "N";
            } else {
              cType = resolvedTypes[index - 1];
            }

            break;

          case "B":
            _lastArabic = false;
            _hasUbatB = true;
            cType = _dir;
            break;

          case "S":
            _hasUbatS = true;
            cType = "N";
            break;

          case "LRE":
          case "RLE":
          case "LRO":
          case "RLO":
          case "PDF":
            _lastArabic = false;
            break;

          case "BN":
            cType = "N";
            break;
        }

        return cType;
      };

      var _handleUbatS = function _handleUbatS(types, levels, length) {
        for (var i = 0; i < length; i++) {
          if (types[i] === "S") {
            levels[i] = _dir;

            for (var j = i - 1; j >= 0; j--) {
              if (types[j] === "WS") {
                levels[j] = _dir;
              } else {
                break;
              }
            }
          }
        }
      };

      var _invertString = function _invertString(text, sourceToTargetMap, levels) {
        var charArray = text.split("");

        if (levels) {
          _computeLevels(charArray, levels, {
            hiLevel: _dir
          });
        }

        charArray.reverse();
        sourceToTargetMap && sourceToTargetMap.reverse();
        return charArray.join("");
      }; // For reference see 3.3 in http://unicode.org/reports/tr9/
      //


      var _computeLevels = function _computeLevels(chars, levels, params) {
        var action,
            condition,
            i,
            index,
            newLevel,
            prevState,
            condPos = -1,
            len = chars.length,
            newState = 0,
            resolvedTypes = [],
            stateTable = _dir ? _STATE_TABLE_RTL : _STATE_TABLE_LTR,
            types = [];
        _lastArabic = false;
        _hasUbatB = false;
        _hasUbatS = false;

        for (i = 0; i < len; i++) {
          types[i] = _getCharType(chars[i]);
        }

        for (index = 0; index < len; index++) {
          prevState = newState;
          resolvedTypes[index] = _resolveCharType(chars, types, resolvedTypes, index);
          newState = stateTable[prevState][_TYPE_NAMES_MAP[resolvedTypes[index]]];
          action = newState & 0xF0;
          newState &= 0x0F;
          levels[index] = newLevel = stateTable[newState][5];

          if (action > 0) {
            if (action === 0x10) {
              for (i = condPos; i < index; i++) {
                levels[i] = 1;
              }

              condPos = -1;
            } else {
              condPos = -1;
            }
          }

          condition = stateTable[newState][6];

          if (condition) {
            if (condPos === -1) {
              condPos = index;
            }
          } else {
            if (condPos > -1) {
              for (i = condPos; i < index; i++) {
                levels[i] = newLevel;
              }

              condPos = -1;
            }
          }

          if (types[index] === "B") {
            levels[index] = 0;
          }

          params.hiLevel |= newLevel;
        }

        if (_hasUbatS) {
          _handleUbatS(types, levels, len);
        }
      }; // for reference see 3.4 in http://unicode.org/reports/tr9/
      //


      var _invertByLevel = function _invertByLevel(level, charArray, sourceToTargetMap, levels, params) {
        if (params.hiLevel < level) {
          return;
        }

        if (level === 1 && _dir === DIR_RTL && !_hasUbatB) {
          charArray.reverse();
          sourceToTargetMap && sourceToTargetMap.reverse();
          return;
        }

        var ch,
            high,
            end,
            low,
            len = charArray.length,
            start = 0;

        while (start < len) {
          if (levels[start] >= level) {
            end = start + 1;

            while (end < len && levels[end] >= level) {
              end++;
            }

            for (low = start, high = end - 1; low < high; low++, high--) {
              ch = charArray[low];
              charArray[low] = charArray[high];
              charArray[high] = ch;

              if (sourceToTargetMap) {
                ch = sourceToTargetMap[low];
                sourceToTargetMap[low] = sourceToTargetMap[high];
                sourceToTargetMap[high] = ch;
              }
            }

            start = end;
          }

          start++;
        }
      }; // for reference see 7 & BD16 in http://unicode.org/reports/tr9/
      //


      var _symmetricSwap = function _symmetricSwap(charArray, levels, params) {
        if (params.hiLevel !== 0 && _isSymmetricSwapping) {
          for (var i = 0, index; i < charArray.length; i++) {
            if (levels[i] === 1) {
              index = _SWAP_TABLE.indexOf(charArray[i]);

              if (index >= 0) {
                charArray[i] = _SWAP_TABLE[index + 1];
              }
            }
          }
        }
      };

      var _reorder = function _reorder(text, sourceToTargetMap, levels) {
        var charArray = text.split(""),
            params = {
          hiLevel: _dir
        };

        if (!levels) {
          levels = [];
        }

        _computeLevels(charArray, levels, params);

        _symmetricSwap(charArray, levels, params);

        _invertByLevel(DIR_RTL + 1, charArray, sourceToTargetMap, levels, params);

        _invertByLevel(DIR_RTL, charArray, sourceToTargetMap, levels, params);

        return charArray.join("");
      }; // doBidiReorder( text, sourceToTargetMap, levels )
      // Performs Bidi reordering by implementing Unicode Bidi algorithm.
      // Returns reordered string
      // @text [String]:
      // - input string to be reordered, this is input parameter
      // $sourceToTargetMap [Array] (optional)
      // - resultant mapping between input and output strings, this is output parameter
      // $levels [Array] (optional)
      // - array of calculated Bidi levels, , this is output parameter


      this.__bidiEngine__.doBidiReorder = function (text, sourceToTargetMap, levels) {
        _init(text, sourceToTargetMap);

        if (!_isInVisual && _isOutVisual && !_isOutRtl) {
          // LLTR->VLTR, LRTL->VLTR
          _dir = _isInRtl ? DIR_RTL : DIR_LTR;
          text = _reorder(text, sourceToTargetMap, levels);
        } else if (_isInVisual && _isOutVisual && _isInRtl ^ _isOutRtl) {
          // VRTL->VLTR, VLTR->VRTL
          _dir = _isInRtl ? DIR_RTL : DIR_LTR;
          text = _invertString(text, sourceToTargetMap, levels);
        } else if (!_isInVisual && _isOutVisual && _isOutRtl) {
          // LLTR->VRTL, LRTL->VRTL
          _dir = _isInRtl ? DIR_RTL : DIR_LTR;
          text = _reorder(text, sourceToTargetMap, levels);
          text = _invertString(text, sourceToTargetMap);
        } else if (_isInVisual && !_isInRtl && !_isOutVisual && !_isOutRtl) {
          // VLTR->LLTR
          _dir = DIR_LTR;
          text = _reorder(text, sourceToTargetMap, levels);
        } else if (_isInVisual && !_isOutVisual && _isInRtl ^ _isOutRtl) {
          // VLTR->LRTL, VRTL->LLTR
          text = _invertString(text, sourceToTargetMap);

          if (_isInRtl) {
            //LLTR -> VLTR
            _dir = DIR_LTR;
            text = _reorder(text, sourceToTargetMap, levels);
          } else {
            //LRTL -> VRTL
            _dir = DIR_RTL;
            text = _reorder(text, sourceToTargetMap, levels);
            text = _invertString(text, sourceToTargetMap);
          }
        } else if (_isInVisual && _isInRtl && !_isOutVisual && _isOutRtl) {
          //  VRTL->LRTL
          _dir = DIR_RTL;
          text = _reorder(text, sourceToTargetMap, levels);
          text = _invertString(text, sourceToTargetMap);
        } else if (!_isInVisual && !_isOutVisual && _isInRtl ^ _isOutRtl) {
          // LRTL->LLTR, LLTR->LRTL
          var isSymmetricSwappingOrig = _isSymmetricSwapping;

          if (_isInRtl) {
            //LRTL->LLTR
            _dir = DIR_RTL;
            text = _reorder(text, sourceToTargetMap, levels);
            _dir = DIR_LTR;
            _isSymmetricSwapping = false;
            text = _reorder(text, sourceToTargetMap, levels);
            _isSymmetricSwapping = isSymmetricSwappingOrig;
          } else {
            //LLTR->LRTL
            _dir = DIR_LTR;
            text = _reorder(text, sourceToTargetMap, levels);
            text = _invertString(text, sourceToTargetMap);
            _dir = DIR_RTL;
            _isSymmetricSwapping = false;
            text = _reorder(text, sourceToTargetMap, levels);
            _isSymmetricSwapping = isSymmetricSwappingOrig;
            text = _invertString(text, sourceToTargetMap);
          }
        }

        return text;
      };
      /**
      * @name setOptions( options )
      * @function 
      * Sets options for Bidi conversion
      * @param {Object}:
      * - isInputVisual {boolean} (defaults to false): allowed values: true(Visual mode), false(Logical mode)
      * - isInputRtl {boolean}: allowed values true(Right-to-left direction), false (Left-to-right directiion), undefined(Contectual direction, i.e.direction defined by first strong character of input string)
      * - isOutputVisual {boolean} (defaults to false): allowed values: true(Visual mode), false(Logical mode)
      * - isOutputRtl {boolean}: allowed values true(Right-to-left direction), false (Left-to-right directiion), undefined(Contectual direction, i.e.direction defined by first strong characterof input string)
      * - isSymmetricSwapping {boolean} (defaults to false): allowed values true(needs symmetric swapping), false (no need in symmetric swapping),
      */


      this.__bidiEngine__.setOptions = function (options) {
        if (options) {
          _isInVisual = options.isInputVisual;
          _isOutVisual = options.isOutputVisual;
          _isInRtl = options.isInputRtl;
          _isOutRtl = options.isOutputRtl;
          _isSymmetricSwapping = options.isSymmetricSwapping;
        }
      };

      this.__bidiEngine__.setOptions(options);

      return this.__bidiEngine__;
    };

    var _bidiUnicodeTypes = bidiUnicodeTypes;
    var bidiEngine = new jsPDF.__bidiEngine__({
      isInputVisual: true
    });

    var bidiEngineFunction = function bidiEngineFunction(args) {
      var text = args.text;
      var x = args.x;
      var y = args.y;
      var options = args.options || {};
      var mutex = args.mutex || {};
      var lang = options.lang;
      var tmpText = [];

      if (Object.prototype.toString.call(text) === '[object Array]') {
        var i = 0;
        tmpText = [];

        for (i = 0; i < text.length; i += 1) {
          if (Object.prototype.toString.call(text[i]) === '[object Array]') {
            tmpText.push([bidiEngine.doBidiReorder(text[i][0]), text[i][1], text[i][2]]);
          } else {
            tmpText.push([bidiEngine.doBidiReorder(text[i])]);
          }
        }

        args.text = tmpText;
      } else {
        args.text = bidiEngine.doBidiReorder(text);
      }
    };

    jsPDF.API.events.push(['postProcessText', bidiEngineFunction]);
  })(jsPDF);

  /*
    Copyright (c) 2008, Adobe Systems Incorporated
    All rights reserved.

    Redistribution and use in source and binary forms, with or without 
    modification, are permitted provided that the following conditions are
    met:

    * Redistributions of source code must retain the above copyright notice, 
      this list of conditions and the following disclaimer.
    
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the 
      documentation and/or other materials provided with the distribution.
    
    * Neither the name of Adobe Systems Incorporated nor the names of its 
      contributors may be used to endorse or promote products derived from 
      this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
    IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
    THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR 
    CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
    EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
    LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
    NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  */

  /************************************************
   * Title : custom font                          *
   * Start Data : 2017. 01. 22.                   *
   * Comment : TEXT API                           *
   ************************************************/

  /******************************
   * jsPDF extension API Design *
   * ****************************/
  (function (jsPDF) {

    var PLUS = '+'.charCodeAt(0);
    var SLASH = '/'.charCodeAt(0);
    var NUMBER = '0'.charCodeAt(0);
    var LOWER = 'a'.charCodeAt(0);
    var UPPER = 'A'.charCodeAt(0);
    var PLUS_URL_SAFE = '-'.charCodeAt(0);
    var SLASH_URL_SAFE = '_'.charCodeAt(0);
    /*****************************************************************/

    /* function : b64ToByteArray                                     */

    /* comment : Base64 encoded TTF file contents (b64) are decoded  */

    /*     by Byte array and stored.                                 */

    /*****************************************************************/

    var b64ToByteArray = function b64ToByteArray(b64) {
      var i, j, l, tmp, placeHolders, arr;

      if (b64.length % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4');
      } // the number of equal signs (place holders)
      // if there are two placeholders, than the two characters before it
      // represent one byte
      // if there is only one, then the three characters before it represent 2 bytes
      // this is just a cheap hack to not do indexOf twice


      var len = b64.length;
      placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0; // base64 is 4/3 + up to two characters of the original data

      arr = new Uint8Array(b64.length * 3 / 4 - placeHolders); // if there are placeholders, only get up to the last complete 4 chars

      l = placeHolders > 0 ? b64.length - 4 : b64.length;
      var L = 0;

      function push(v) {
        arr[L++] = v;
      }

      for (i = 0, j = 0; i < l; i += 4, j += 3) {
        tmp = decode(b64.charAt(i)) << 18 | decode(b64.charAt(i + 1)) << 12 | decode(b64.charAt(i + 2)) << 6 | decode(b64.charAt(i + 3));
        push((tmp & 0xFF0000) >> 16);
        push((tmp & 0xFF00) >> 8);
        push(tmp & 0xFF);
      }

      if (placeHolders === 2) {
        tmp = decode(b64.charAt(i)) << 2 | decode(b64.charAt(i + 1)) >> 4;
        push(tmp & 0xFF);
      } else if (placeHolders === 1) {
        tmp = decode(b64.charAt(i)) << 10 | decode(b64.charAt(i + 1)) << 4 | decode(b64.charAt(i + 2)) >> 2;
        push(tmp >> 8 & 0xFF);
        push(tmp & 0xFF);
      }

      return arr;
    };
    /***************************************************************/

    /* function : decode                                           */

    /* comment : Change the base64 encoded font's content to match */

    /*   the base64 index value.                                   */

    /***************************************************************/


    var decode = function decode(elt) {
      var code = elt.charCodeAt(0);
      if (code === PLUS || code === PLUS_URL_SAFE) return 62; // '+'

      if (code === SLASH || code === SLASH_URL_SAFE) return 63; // '/'

      if (code < NUMBER) return -1; //no match

      if (code < NUMBER + 10) return code - NUMBER + 26 + 26;
      if (code < UPPER + 26) return code - UPPER;
      if (code < LOWER + 26) return code - LOWER + 26;
    };

    jsPDF.API.TTFFont = function () {
      /************************************************************************/

      /* function : open                                                       */

      /* comment : Decode the encoded ttf content and create a TTFFont object. */

      /************************************************************************/
      TTFFont.open = function (filename, name, vfs, encoding) {
        var contents;

        if (typeof vfs !== "string") {
          throw new Error('Invalid argument supplied in TTFFont.open');
        }

        contents = b64ToByteArray(vfs);
        return new TTFFont(contents, name, encoding);
      };
      /***************************************************************/

      /* function : TTFFont gernerator                               */

      /* comment : Decode TTF contents are parsed, Data,             */

      /* Subset object is created, and registerTTF function is called.*/

      /***************************************************************/


      function TTFFont(rawData, name, encoding) {
        var data;

        this.rawData = rawData;
        data = this.contents = new Data(rawData);
        this.contents.pos = 4;

        if (data.readString(4) === 'ttcf') {
          if (!name) {
            throw new Error("Must specify a font name for TTC files.");
          }
          throw new Error("Font " + name + " not found in TTC file.");
        } else {
          data.pos = 0;
          this.parse();
          this.subset = new Subset(this);
          this.registerTTF();
        }
      }
      /********************************************************/

      /* function : parse                                     */

      /* comment : TTF Parses the file contents by each table.*/

      /********************************************************/


      TTFFont.prototype.parse = function () {
        this.directory = new Directory(this.contents);
        this.head = new HeadTable(this);
        this.name = new NameTable(this);
        this.cmap = new CmapTable(this);
        this.toUnicode = new Map();
        this.hhea = new HheaTable(this);
        this.maxp = new MaxpTable(this);
        this.hmtx = new HmtxTable(this);
        this.post = new PostTable(this);
        this.os2 = new OS2Table(this);
        this.loca = new LocaTable(this);
        this.glyf = new GlyfTable(this);
        this.ascender = this.os2.exists && this.os2.ascender || this.hhea.ascender;
        this.decender = this.os2.exists && this.os2.decender || this.hhea.decender;
        this.lineGap = this.os2.exists && this.os2.lineGap || this.hhea.lineGap;
        return this.bbox = [this.head.xMin, this.head.yMin, this.head.xMax, this.head.yMax];
      };
      /***************************************************************/

      /* function : registerTTF                                      */

      /* comment : Get the value to assign pdf font descriptors.     */

      /***************************************************************/


      TTFFont.prototype.registerTTF = function () {
        var e, hi, low, raw, _ref;

        this.scaleFactor = 1000.0 / this.head.unitsPerEm;

        this.bbox = function () {
          var _i, _len, _ref, _results;

          _ref = this.bbox;
          _results = [];

          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            e = _ref[_i];

            _results.push(Math.round(e * this.scaleFactor));
          }

          return _results;
        }.call(this);

        this.stemV = 0;

        if (this.post.exists) {
          raw = this.post.italic_angle;
          hi = raw >> 16;
          low = raw & 0xFF;

          if (hi & 0x8000 !== 0) {
            hi = -((hi ^ 0xFFFF) + 1);
          }

          this.italicAngle = +("" + hi + "." + low);
        } else {
          this.italicAngle = 0;
        }

        this.ascender = Math.round(this.ascender * this.scaleFactor);
        this.decender = Math.round(this.decender * this.scaleFactor);
        this.lineGap = Math.round(this.lineGap * this.scaleFactor);
        this.capHeight = this.os2.exists && this.os2.capHeight || this.ascender;
        this.xHeight = this.os2.exists && this.os2.xHeight || 0;
        this.familyClass = (this.os2.exists && this.os2.familyClass || 0) >> 8;
        this.isSerif = (_ref = this.familyClass) === 1 || _ref === 2 || _ref === 3 || _ref === 4 || _ref === 5 || _ref === 7;
        this.isScript = this.familyClass === 10;
        this.flags = 0;

        if (this.post.isFixedPitch) {
          this.flags |= 1 << 0;
        }

        if (this.isSerif) {
          this.flags |= 1 << 1;
        }

        if (this.isScript) {
          this.flags |= 1 << 3;
        }

        if (this.italicAngle !== 0) {
          this.flags |= 1 << 6;
        }

        this.flags |= 1 << 5;

        if (!this.cmap.unicode) {
          throw new Error('No unicode cmap for font');
        }
      };

      TTFFont.prototype.characterToGlyph = function (character) {
        var _ref;

        return ((_ref = this.cmap.unicode) != null ? _ref.codeMap[character] : void 0) || 0;
      };

      TTFFont.prototype.widthOfGlyph = function (glyph) {
        var scale;
        scale = 1000.0 / this.head.unitsPerEm;
        return this.hmtx.forGlyph(glyph).advance * scale;
      };

      TTFFont.prototype.widthOfString = function (string, size, charSpace) {
        var charCode, i, scale, width, _i, _ref, charSpace;

        string = '' + string;
        width = 0;

        for (i = _i = 0, _ref = string.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          charCode = string.charCodeAt(i);
          width += this.widthOfGlyph(this.characterToGlyph(charCode)) + charSpace * (1000 / size) || 0;
        }

        scale = size / 1000;
        return width * scale;
      };

      TTFFont.prototype.lineHeight = function (size, includeGap) {
        var gap;

        if (includeGap == null) {
          includeGap = false;
        }

        gap = includeGap ? this.lineGap : 0;
        return (this.ascender + gap - this.decender) / 1000 * size;
      };

      return TTFFont;
    }();
    /************************************************************************************************/

    /* function : Data                                                                              */

    /* comment : The ttf data decoded and stored in an array is read and written to the Data object.*/

    /************************************************************************************************/


    var Data = function () {
      function Data(data) {
        this.data = data != null ? data : [];
        this.pos = 0;
        this.length = this.data.length;
      }

      Data.prototype.readByte = function () {
        return this.data[this.pos++];
      };

      Data.prototype.writeByte = function (byte) {
        return this.data[this.pos++] = byte;
      };

      Data.prototype.readUInt32 = function () {
        var b1, b2, b3, b4;
        b1 = this.readByte() * 0x1000000;
        b2 = this.readByte() << 16;
        b3 = this.readByte() << 8;
        b4 = this.readByte();
        return b1 + b2 + b3 + b4;
      };

      Data.prototype.writeUInt32 = function (val) {
        this.writeByte(val >>> 24 & 0xff);
        this.writeByte(val >> 16 & 0xff);
        this.writeByte(val >> 8 & 0xff);
        return this.writeByte(val & 0xff);
      };

      Data.prototype.readInt32 = function () {
        var int;
        int = this.readUInt32();

        if (int >= 0x80000000) {
          return int - 0x100000000;
        } else {
          return int;
        }
      };

      Data.prototype.writeInt32 = function (val) {
        if (val < 0) {
          val += 0x100000000;
        }

        return this.writeUInt32(val);
      };

      Data.prototype.readUInt16 = function () {
        var b1, b2;
        b1 = this.readByte() << 8;
        b2 = this.readByte();
        return b1 | b2;
      };

      Data.prototype.writeUInt16 = function (val) {
        this.writeByte(val >> 8 & 0xff);
        return this.writeByte(val & 0xff);
      };

      Data.prototype.readInt16 = function () {
        var int;
        int = this.readUInt16();

        if (int >= 0x8000) {
          return int - 0x10000;
        } else {
          return int;
        }
      };

      Data.prototype.writeInt16 = function (val) {
        if (val < 0) {
          val += 0x10000;
        }

        return this.writeUInt16(val);
      };

      Data.prototype.readString = function (length) {
        var i, ret, _i;

        ret = [];

        for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
          ret[i] = String.fromCharCode(this.readByte());
        }

        return ret.join('');
      };

      Data.prototype.writeString = function (val) {
        var i, _i, _ref, _results;

        _results = [];

        for (i = _i = 0, _ref = val.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(this.writeByte(val.charCodeAt(i)));
        }

        return _results;
      };
      /*Data.prototype.stringAt = function (pos, length) {
          this.pos = pos;
          return this.readString(length);
      };*/


      Data.prototype.readShort = function () {
        return this.readInt16();
      };

      Data.prototype.writeShort = function (val) {
        return this.writeInt16(val);
      };

      Data.prototype.readLongLong = function () {
        var b1, b2, b3, b4, b5, b6, b7, b8;
        b1 = this.readByte();
        b2 = this.readByte();
        b3 = this.readByte();
        b4 = this.readByte();
        b5 = this.readByte();
        b6 = this.readByte();
        b7 = this.readByte();
        b8 = this.readByte();

        if (b1 & 0x80) {
          return ((b1 ^ 0xff) * 0x100000000000000 + (b2 ^ 0xff) * 0x1000000000000 + (b3 ^ 0xff) * 0x10000000000 + (b4 ^ 0xff) * 0x100000000 + (b5 ^ 0xff) * 0x1000000 + (b6 ^ 0xff) * 0x10000 + (b7 ^ 0xff) * 0x100 + (b8 ^ 0xff) + 1) * -1;
        }

        return b1 * 0x100000000000000 + b2 * 0x1000000000000 + b3 * 0x10000000000 + b4 * 0x100000000 + b5 * 0x1000000 + b6 * 0x10000 + b7 * 0x100 + b8;
      };

      Data.prototype.writeLongLong = function (val) {
        var high, low;
        high = Math.floor(val / 0x100000000);
        low = val & 0xffffffff;
        this.writeByte(high >> 24 & 0xff);
        this.writeByte(high >> 16 & 0xff);
        this.writeByte(high >> 8 & 0xff);
        this.writeByte(high & 0xff);
        this.writeByte(low >> 24 & 0xff);
        this.writeByte(low >> 16 & 0xff);
        this.writeByte(low >> 8 & 0xff);
        return this.writeByte(low & 0xff);
      };

      Data.prototype.readInt = function () {
        return this.readInt32();
      };

      Data.prototype.writeInt = function (val) {
        return this.writeInt32(val);
      };
      /*Data.prototype.slice = function (start, end) {
          return this.data.slice(start, end);
      };*/


      Data.prototype.read = function (bytes) {
        var buf, i, _i;

        buf = [];

        for (i = _i = 0; 0 <= bytes ? _i < bytes : _i > bytes; i = 0 <= bytes ? ++_i : --_i) {
          buf.push(this.readByte());
        }

        return buf;
      };

      Data.prototype.write = function (bytes) {
        var byte, _i, _len, _results;

        _results = [];

        for (_i = 0, _len = bytes.length; _i < _len; _i++) {
          byte = bytes[_i];

          _results.push(this.writeByte(byte));
        }

        return _results;
      };

      return Data;
    }();

    var Directory = function () {
      var checksum;
      /*****************************************************************************************************/

      /* function : Directory generator                                                                    */

      /* comment : Initialize the offset, tag, length, and checksum for each table for the font to be used.*/

      /*****************************************************************************************************/

      function Directory(data) {
        var entry, i, _i, _ref;

        this.scalarType = data.readInt();
        this.tableCount = data.readShort();
        this.searchRange = data.readShort();
        this.entrySelector = data.readShort();
        this.rangeShift = data.readShort();
        this.tables = {};

        for (i = _i = 0, _ref = this.tableCount; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          entry = {
            tag: data.readString(4),
            checksum: data.readInt(),
            offset: data.readInt(),
            length: data.readInt()
          };
          this.tables[entry.tag] = entry;
        }
      }
      /********************************************************************************************************/

      /* function : encode                                                                                    */

      /* comment : It encodes and stores the font table object and information used for the directory object. */

      /********************************************************************************************************/


      Directory.prototype.encode = function (tables) {
        var adjustment, directory, directoryLength, entrySelector, headOffset, log2, offset, rangeShift, searchRange, sum, table, tableCount, tableData, tag;
        tableCount = Object.keys(tables).length;
        log2 = Math.log(2);
        searchRange = Math.floor(Math.log(tableCount) / log2) * 16;
        entrySelector = Math.floor(searchRange / log2);
        rangeShift = tableCount * 16 - searchRange;
        directory = new Data();
        directory.writeInt(this.scalarType);
        directory.writeShort(tableCount);
        directory.writeShort(searchRange);
        directory.writeShort(entrySelector);
        directory.writeShort(rangeShift);
        directoryLength = tableCount * 16;
        offset = directory.pos + directoryLength;
        headOffset = null;
        tableData = [];

        for (tag in tables) {
          table = tables[tag];
          directory.writeString(tag);
          directory.writeInt(checksum(table));
          directory.writeInt(offset);
          directory.writeInt(table.length);
          tableData = tableData.concat(table);

          if (tag === 'head') {
            headOffset = offset;
          }

          offset += table.length;

          while (offset % 4) {
            tableData.push(0);
            offset++;
          }
        }

        directory.write(tableData);
        sum = checksum(directory.data);
        adjustment = 0xB1B0AFBA - sum;
        directory.pos = headOffset + 8;
        directory.writeUInt32(adjustment);
        return directory.data;
      };
      /***************************************************************/

      /* function : checksum                                         */

      /* comment : Duplicate the table for the tag.                  */

      /***************************************************************/


      checksum = function checksum(data) {
        var i, sum, tmp, _i, _ref;

        data = __slice.call(data);

        while (data.length % 4) {
          data.push(0);
        }

        tmp = new Data(data);
        sum = 0;

        for (i = _i = 0, _ref = data.length; _i < _ref; i = _i += 4) {
          sum += tmp.readUInt32();
        }

        return sum & 0xFFFFFFFF;
      };

      return Directory;
    }();

    var Table,
        __hasProp = {}.hasOwnProperty,
        __extends = function __extends(child, parent) {
      for (var key in parent) {
        if (__hasProp.call(parent, key)) child[key] = parent[key];
      }

      function ctor() {
        this.constructor = child;
      }

      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
      child.__super__ = parent.prototype;
      return child;
    };
    /***************************************************************/

    /* function : Table                                            */

    /* comment : Save info for each table, and parse the table.    */

    /***************************************************************/

    Table = function () {
      function Table(file) {
        var info;
        this.file = file;
        info = this.file.directory.tables[this.tag];
        this.exists = !!info;

        if (info) {
          this.offset = info.offset, this.length = info.length;
          this.parse(this.file.contents);
        }
      }

      Table.prototype.parse = function () {};

      Table.prototype.encode = function () {};

      Table.prototype.raw = function () {
        if (!this.exists) {
          return null;
        }

        this.file.contents.pos = this.offset;
        return this.file.contents.read(this.length);
      };

      return Table;
    }();

    var HeadTable = function (_super) {
      __extends(HeadTable, _super);

      function HeadTable() {
        return HeadTable.__super__.constructor.apply(this, arguments);
      }

      HeadTable.prototype.tag = 'head';

      HeadTable.prototype.parse = function (data) {
        data.pos = this.offset;
        this.version = data.readInt();
        this.revision = data.readInt();
        this.checkSumAdjustment = data.readInt();
        this.magicNumber = data.readInt();
        this.flags = data.readShort();
        this.unitsPerEm = data.readShort();
        this.created = data.readLongLong();
        this.modified = data.readLongLong();
        this.xMin = data.readShort();
        this.yMin = data.readShort();
        this.xMax = data.readShort();
        this.yMax = data.readShort();
        this.macStyle = data.readShort();
        this.lowestRecPPEM = data.readShort();
        this.fontDirectionHint = data.readShort();
        this.indexToLocFormat = data.readShort();
        return this.glyphDataFormat = data.readShort();
      };

      HeadTable.prototype.encode = function (indexToLocFormat) {
        var table;
        table = new Data();
        table.writeInt(this.version);
        table.writeInt(this.revision);
        table.writeInt(this.checkSumAdjustment);
        table.writeInt(this.magicNumber);
        table.writeShort(this.flags);
        table.writeShort(this.unitsPerEm);
        table.writeLongLong(this.created);
        table.writeLongLong(this.modified);
        table.writeShort(this.xMin);
        table.writeShort(this.yMin);
        table.writeShort(this.xMax);
        table.writeShort(this.yMax);
        table.writeShort(this.macStyle);
        table.writeShort(this.lowestRecPPEM);
        table.writeShort(this.fontDirectionHint);
        table.writeShort(indexToLocFormat);
        table.writeShort(this.glyphDataFormat);
        return table.data;
      };

      return HeadTable;
    }(Table);
    /************************************************************************************/

    /* function : CmapEntry                                                             */

    /* comment : Cmap Initializes and encodes object information (required by pdf spec).*/

    /************************************************************************************/


    var CmapEntry = function () {
      function CmapEntry(data, offset) {
        var code, count, endCode, glyphId, glyphIds, i, idDelta, idRangeOffset, index, saveOffset, segCount, segCountX2, start, startCode, tail, _i, _j, _k, _len;

        this.platformID = data.readUInt16();
        this.encodingID = data.readShort();
        this.offset = offset + data.readInt();
        saveOffset = data.pos;
        data.pos = this.offset;
        this.format = data.readUInt16();
        this.length = data.readUInt16();
        this.language = data.readUInt16();
        this.isUnicode = this.platformID === 3 && this.encodingID === 1 && this.format === 4 || this.platformID === 0 && this.format === 4;
        this.codeMap = {};

        switch (this.format) {
          case 0:
            for (i = _i = 0; _i < 256; i = ++_i) {
              this.codeMap[i] = data.readByte();
            }

            break;

          case 4:
            segCountX2 = data.readUInt16();
            segCount = segCountX2 / 2;
            data.pos += 6;

            endCode = function () {
              var _j, _results;

              _results = [];

              for (i = _j = 0; 0 <= segCount ? _j < segCount : _j > segCount; i = 0 <= segCount ? ++_j : --_j) {
                _results.push(data.readUInt16());
              }

              return _results;
            }();

            data.pos += 2;

            startCode = function () {
              var _j, _results;

              _results = [];

              for (i = _j = 0; 0 <= segCount ? _j < segCount : _j > segCount; i = 0 <= segCount ? ++_j : --_j) {
                _results.push(data.readUInt16());
              }

              return _results;
            }();

            idDelta = function () {
              var _j, _results;

              _results = [];

              for (i = _j = 0; 0 <= segCount ? _j < segCount : _j > segCount; i = 0 <= segCount ? ++_j : --_j) {
                _results.push(data.readUInt16());
              }

              return _results;
            }();

            idRangeOffset = function () {
              var _j, _results;

              _results = [];

              for (i = _j = 0; 0 <= segCount ? _j < segCount : _j > segCount; i = 0 <= segCount ? ++_j : --_j) {
                _results.push(data.readUInt16());
              }

              return _results;
            }();

            count = (this.length - data.pos + this.offset) / 2;

            glyphIds = function () {
              var _j, _results;

              _results = [];

              for (i = _j = 0; 0 <= count ? _j < count : _j > count; i = 0 <= count ? ++_j : --_j) {
                _results.push(data.readUInt16());
              }

              return _results;
            }();

            for (i = _j = 0, _len = endCode.length; _j < _len; i = ++_j) {
              tail = endCode[i];
              start = startCode[i];

              for (code = _k = start; start <= tail ? _k <= tail : _k >= tail; code = start <= tail ? ++_k : --_k) {
                if (idRangeOffset[i] === 0) {
                  glyphId = code + idDelta[i];
                } else {
                  index = idRangeOffset[i] / 2 + (code - start) - (segCount - i);
                  glyphId = glyphIds[index] || 0;

                  if (glyphId !== 0) {
                    glyphId += idDelta[i];
                  }
                }

                this.codeMap[code] = glyphId & 0xFFFF;
              }
            }

        }

        data.pos = saveOffset;
      }

      CmapEntry.encode = function (charmap, encoding) {
        var charMap, code, codeMap, codes, delta, deltas, diff, endCode, endCodes, entrySelector, glyphIDs, i, id, indexes, last, map, nextID, offset, old, rangeOffsets, rangeShift, result, searchRange, segCount, segCountX2, startCode, startCodes, startGlyph, subtable, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _name, _o, _p, _q;

        subtable = new Data();
        codes = Object.keys(charmap).sort(function (a, b) {
          return a - b;
        });

        switch (encoding) {
          case 'macroman':
            id = 0;

            indexes = function () {
              var _i, _results;

              _results = [];

              for (i = _i = 0; _i < 256; i = ++_i) {
                _results.push(0);
              }

              return _results;
            }();

            map = {
              0: 0
            };
            codeMap = {};

            for (_i = 0, _len = codes.length; _i < _len; _i++) {
              code = codes[_i];

              if (map[_name = charmap[code]] == null) {
                map[_name] = ++id;
              }

              codeMap[code] = {
                old: charmap[code],
                "new": map[charmap[code]]
              };
              indexes[code] = map[charmap[code]];
            }

            subtable.writeUInt16(1);
            subtable.writeUInt16(0);
            subtable.writeUInt32(12);
            subtable.writeUInt16(0);
            subtable.writeUInt16(262);
            subtable.writeUInt16(0);
            subtable.write(indexes);
            return result = {
              charMap: codeMap,
              subtable: subtable.data,
              maxGlyphID: id + 1
            };

          case 'unicode':
            startCodes = [];
            endCodes = [];
            nextID = 0;
            map = {};
            charMap = {};
            last = diff = null;

            for (_j = 0, _len1 = codes.length; _j < _len1; _j++) {
              code = codes[_j];
              old = charmap[code];

              if (map[old] == null) {
                map[old] = ++nextID;
              }

              charMap[code] = {
                old: old,
                "new": map[old]
              };
              delta = map[old] - code;

              if (last == null || delta !== diff) {
                if (last) {
                  endCodes.push(last);
                }

                startCodes.push(code);
                diff = delta;
              }

              last = code;
            }

            if (last) {
              endCodes.push(last);
            }

            endCodes.push(0xFFFF);
            startCodes.push(0xFFFF);
            segCount = startCodes.length;
            segCountX2 = segCount * 2;
            searchRange = 2 * Math.pow(Math.log(segCount) / Math.LN2, 2);
            entrySelector = Math.log(searchRange / 2) / Math.LN2;
            rangeShift = 2 * segCount - searchRange;
            deltas = [];
            rangeOffsets = [];
            glyphIDs = [];

            for (i = _k = 0, _len2 = startCodes.length; _k < _len2; i = ++_k) {
              startCode = startCodes[i];
              endCode = endCodes[i];

              if (startCode === 0xFFFF) {
                deltas.push(0);
                rangeOffsets.push(0);
                break;
              }

              startGlyph = charMap[startCode]["new"];

              if (startCode - startGlyph >= 0x8000) {
                deltas.push(0);
                rangeOffsets.push(2 * (glyphIDs.length + segCount - i));

                for (code = _l = startCode; startCode <= endCode ? _l <= endCode : _l >= endCode; code = startCode <= endCode ? ++_l : --_l) {
                  glyphIDs.push(charMap[code]["new"]);
                }
              } else {
                deltas.push(startGlyph - startCode);
                rangeOffsets.push(0);
              }
            }

            subtable.writeUInt16(3);
            subtable.writeUInt16(1);
            subtable.writeUInt32(12);
            subtable.writeUInt16(4);
            subtable.writeUInt16(16 + segCount * 8 + glyphIDs.length * 2);
            subtable.writeUInt16(0);
            subtable.writeUInt16(segCountX2);
            subtable.writeUInt16(searchRange);
            subtable.writeUInt16(entrySelector);
            subtable.writeUInt16(rangeShift);

            for (_m = 0, _len3 = endCodes.length; _m < _len3; _m++) {
              code = endCodes[_m];
              subtable.writeUInt16(code);
            }

            subtable.writeUInt16(0);

            for (_n = 0, _len4 = startCodes.length; _n < _len4; _n++) {
              code = startCodes[_n];
              subtable.writeUInt16(code);
            }

            for (_o = 0, _len5 = deltas.length; _o < _len5; _o++) {
              delta = deltas[_o];
              subtable.writeUInt16(delta);
            }

            for (_p = 0, _len6 = rangeOffsets.length; _p < _len6; _p++) {
              offset = rangeOffsets[_p];
              subtable.writeUInt16(offset);
            }

            for (_q = 0, _len7 = glyphIDs.length; _q < _len7; _q++) {
              id = glyphIDs[_q];
              subtable.writeUInt16(id);
            }

            return result = {
              charMap: charMap,
              subtable: subtable.data,
              maxGlyphID: nextID + 1
            };
        }
      };

      return CmapEntry;
    }();

    var CmapTable = function (_super) {
      __extends(CmapTable, _super);

      function CmapTable() {
        return CmapTable.__super__.constructor.apply(this, arguments);
      }

      CmapTable.prototype.tag = 'cmap';

      CmapTable.prototype.parse = function (data) {
        var entry, i, tableCount, _i;

        data.pos = this.offset;
        this.version = data.readUInt16();
        tableCount = data.readUInt16();
        this.tables = [];
        this.unicode = null;

        for (i = _i = 0; 0 <= tableCount ? _i < tableCount : _i > tableCount; i = 0 <= tableCount ? ++_i : --_i) {
          entry = new CmapEntry(data, this.offset);
          this.tables.push(entry);

          if (entry.isUnicode) {
            if (this.unicode == null) {
              this.unicode = entry;
            }
          }
        }

        return true;
      };
      /*************************************************************************/

      /* function : encode                                                     */

      /* comment : Encode the cmap table corresponding to the input character. */

      /*************************************************************************/


      CmapTable.encode = function (charmap, encoding) {
        var result, table;

        if (encoding == null) {
          encoding = 'macroman';
        }

        result = CmapEntry.encode(charmap, encoding);
        table = new Data();
        table.writeUInt16(0);
        table.writeUInt16(1);
        result.table = table.data.concat(result.subtable);
        return result;
      };

      return CmapTable;
    }(Table);

    var HheaTable = function (_super) {
      __extends(HheaTable, _super);

      function HheaTable() {
        return HheaTable.__super__.constructor.apply(this, arguments);
      }

      HheaTable.prototype.tag = 'hhea';

      HheaTable.prototype.parse = function (data) {
        data.pos = this.offset;
        this.version = data.readInt();
        this.ascender = data.readShort();
        this.decender = data.readShort();
        this.lineGap = data.readShort();
        this.advanceWidthMax = data.readShort();
        this.minLeftSideBearing = data.readShort();
        this.minRightSideBearing = data.readShort();
        this.xMaxExtent = data.readShort();
        this.caretSlopeRise = data.readShort();
        this.caretSlopeRun = data.readShort();
        this.caretOffset = data.readShort();
        data.pos += 4 * 2;
        this.metricDataFormat = data.readShort();
        return this.numberOfMetrics = data.readUInt16();
      };
      /*HheaTable.prototype.encode = function (ids) {
          var i, table, _i, _ref;
          table = new Data;
          table.writeInt(this.version);
          table.writeShort(this.ascender);
          table.writeShort(this.decender);
          table.writeShort(this.lineGap);
          table.writeShort(this.advanceWidthMax);
          table.writeShort(this.minLeftSideBearing);
          table.writeShort(this.minRightSideBearing);
          table.writeShort(this.xMaxExtent);
          table.writeShort(this.caretSlopeRise);
          table.writeShort(this.caretSlopeRun);
          table.writeShort(this.caretOffset);
          for (i = _i = 0, _ref = 4 * 2; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
              table.writeByte(0);
          }
          table.writeShort(this.metricDataFormat);
          table.writeUInt16(ids.length);
          return table.data;
      };*/


      return HheaTable;
    }(Table);

    var OS2Table = function (_super) {
      __extends(OS2Table, _super);

      function OS2Table() {
        return OS2Table.__super__.constructor.apply(this, arguments);
      }

      OS2Table.prototype.tag = 'OS/2';

      OS2Table.prototype.parse = function (data) {
        var i;
        data.pos = this.offset;
        this.version = data.readUInt16();
        this.averageCharWidth = data.readShort();
        this.weightClass = data.readUInt16();
        this.widthClass = data.readUInt16();
        this.type = data.readShort();
        this.ySubscriptXSize = data.readShort();
        this.ySubscriptYSize = data.readShort();
        this.ySubscriptXOffset = data.readShort();
        this.ySubscriptYOffset = data.readShort();
        this.ySuperscriptXSize = data.readShort();
        this.ySuperscriptYSize = data.readShort();
        this.ySuperscriptXOffset = data.readShort();
        this.ySuperscriptYOffset = data.readShort();
        this.yStrikeoutSize = data.readShort();
        this.yStrikeoutPosition = data.readShort();
        this.familyClass = data.readShort();

        this.panose = function () {
          var _i, _results;

          _results = [];

          for (i = _i = 0; _i < 10; i = ++_i) {
            _results.push(data.readByte());
          }

          return _results;
        }();

        this.charRange = function () {
          var _i, _results;

          _results = [];

          for (i = _i = 0; _i < 4; i = ++_i) {
            _results.push(data.readInt());
          }

          return _results;
        }();

        this.vendorID = data.readString(4);
        this.selection = data.readShort();
        this.firstCharIndex = data.readShort();
        this.lastCharIndex = data.readShort();

        if (this.version > 0) {
          this.ascent = data.readShort();
          this.descent = data.readShort();
          this.lineGap = data.readShort();
          this.winAscent = data.readShort();
          this.winDescent = data.readShort();

          this.codePageRange = function () {
            var _i, _results;

            _results = [];

            for (i = _i = 0; _i < 2; i = ++_i) {
              _results.push(data.readInt());
            }

            return _results;
          }();

          if (this.version > 1) {
            this.xHeight = data.readShort();
            this.capHeight = data.readShort();
            this.defaultChar = data.readShort();
            this.breakChar = data.readShort();
            return this.maxContext = data.readShort();
          }
        }
      };
      /*OS2Table.prototype.encode = function () {
          return this.raw();
      };*/


      return OS2Table;
    }(Table);

    var PostTable = function (_super) {

      __extends(PostTable, _super);

      function PostTable() {
        return PostTable.__super__.constructor.apply(this, arguments);
      }

      PostTable.prototype.tag = 'post';

      PostTable.prototype.parse = function (data) {
        var i, length, numberOfGlyphs, _i, _results;

        data.pos = this.offset;
        this.format = data.readInt();
        this.italicAngle = data.readInt();
        this.underlinePosition = data.readShort();
        this.underlineThickness = data.readShort();
        this.isFixedPitch = data.readInt();
        this.minMemType42 = data.readInt();
        this.maxMemType42 = data.readInt();
        this.minMemType1 = data.readInt();
        this.maxMemType1 = data.readInt();

        switch (this.format) {
          case 0x00010000:
            break;

          case 0x00020000:
            numberOfGlyphs = data.readUInt16();
            this.glyphNameIndex = [];

            for (i = _i = 0; 0 <= numberOfGlyphs ? _i < numberOfGlyphs : _i > numberOfGlyphs; i = 0 <= numberOfGlyphs ? ++_i : --_i) {
              this.glyphNameIndex.push(data.readUInt16());
            }

            this.names = [];
            _results = [];

            while (data.pos < this.offset + this.length) {
              length = data.readByte();

              _results.push(this.names.push(data.readString(length)));
            }

            return _results;
            break;

          case 0x00025000:
            numberOfGlyphs = data.readUInt16();
            return this.offsets = data.read(numberOfGlyphs);

          case 0x00030000:
            break;

          case 0x00040000:
            return this.map = function () {
              var _j, _ref, _results1;

              _results1 = [];

              for (i = _j = 0, _ref = this.file.maxp.numGlyphs; 0 <= _ref ? _j < _ref : _j > _ref; i = 0 <= _ref ? ++_j : --_j) {
                _results1.push(data.readUInt32());
              }

              return _results1;
            }.call(this);
        }
      };
      return PostTable;
    }(Table);
    /*********************************************************************************************************/

    /* function : NameEntry                                                                                  */

    /* comment : Store copyright information, platformID, encodingID, and languageID in the NameEntry object.*/

    /*********************************************************************************************************/


    var NameEntry = function () {
      function NameEntry(raw, entry) {
        this.raw = raw;
        this.length = raw.length;
        this.platformID = entry.platformID;
        this.encodingID = entry.encodingID;
        this.languageID = entry.languageID;
      }

      return NameEntry;
    }();

    var NameTable = function (_super) {

      __extends(NameTable, _super);

      function NameTable() {
        return NameTable.__super__.constructor.apply(this, arguments);
      }

      NameTable.prototype.tag = 'name';

      NameTable.prototype.parse = function (data) {
        var count, entries, entry, format, i, name, stringOffset, strings, text, _i, _j, _len, _name;

        data.pos = this.offset;
        format = data.readShort();
        count = data.readShort();
        stringOffset = data.readShort();
        entries = [];

        for (i = _i = 0; 0 <= count ? _i < count : _i > count; i = 0 <= count ? ++_i : --_i) {
          entries.push({
            platformID: data.readShort(),
            encodingID: data.readShort(),
            languageID: data.readShort(),
            nameID: data.readShort(),
            length: data.readShort(),
            offset: this.offset + stringOffset + data.readShort()
          });
        }

        strings = {};

        for (i = _j = 0, _len = entries.length; _j < _len; i = ++_j) {
          entry = entries[i];
          data.pos = entry.offset;
          text = data.readString(entry.length);
          name = new NameEntry(text, entry);

          if (strings[_name = entry.nameID] == null) {
            strings[_name] = [];
          }

          strings[entry.nameID].push(name);
        }

        this.strings = strings;
        this.copyright = strings[0];
        this.fontFamily = strings[1];
        this.fontSubfamily = strings[2];
        this.uniqueSubfamily = strings[3];
        this.fontName = strings[4];
        this.version = strings[5];

        try {
          this.postscriptName = strings[6][0].raw.replace(/[\x00-\x19\x80-\xff]/g, "");
        } catch (e) {
          this.postscriptName = strings[4][0].raw.replace(/[\x00-\x19\x80-\xff]/g, "");
        }

        this.trademark = strings[7];
        this.manufacturer = strings[8];
        this.designer = strings[9];
        this.description = strings[10];
        this.vendorUrl = strings[11];
        this.designerUrl = strings[12];
        this.license = strings[13];
        this.licenseUrl = strings[14];
        this.preferredFamily = strings[15];
        this.preferredSubfamily = strings[17];
        this.compatibleFull = strings[18];
        return this.sampleText = strings[19];
      };
      /*NameTable.prototype.encode = function () {
          var id, list, nameID, nameTable, postscriptName, strCount, strTable, string, strings, table, val, _i, _len, _ref;
          strings = {};
          _ref = this.strings;
          for (id in _ref) {
              val = _ref[id];
              strings[id] = val;
          }
          postscriptName = new NameEntry("" + subsetTag + "+" + this.postscriptName, {
              platformID: 1
              , encodingID: 0
              , languageID: 0
          });
          strings[6] = [postscriptName];
          subsetTag = successorOf(subsetTag);
          strCount = 0;
          for (id in strings) {
              list = strings[id];
              if (list != null) {
                  strCount += list.length;
              }
          }
          table = new Data;
          strTable = new Data;
          table.writeShort(0);
          table.writeShort(strCount);
          table.writeShort(6 + 12 * strCount);
          for (nameID in strings) {
              list = strings[nameID];
              if (list != null) {
                  for (_i = 0, _len = list.length; _i < _len; _i++) {
                      string = list[_i];
                      table.writeShort(string.platformID);
                      table.writeShort(string.encodingID);
                      table.writeShort(string.languageID);
                      table.writeShort(nameID);
                      table.writeShort(string.length);
                      table.writeShort(strTable.pos);
                      strTable.writeString(string.raw);
                  }
              }
          }
          return nameTable = {
              postscriptName: postscriptName.raw
              , table: table.data.concat(strTable.data)
          };
      };*/

      return NameTable;
    }(Table);

    var MaxpTable = function (_super) {
      __extends(MaxpTable, _super);

      function MaxpTable() {
        return MaxpTable.__super__.constructor.apply(this, arguments);
      }

      MaxpTable.prototype.tag = 'maxp';

      MaxpTable.prototype.parse = function (data) {
        data.pos = this.offset;
        this.version = data.readInt();
        this.numGlyphs = data.readUInt16();
        this.maxPoints = data.readUInt16();
        this.maxContours = data.readUInt16();
        this.maxCompositePoints = data.readUInt16();
        this.maxComponentContours = data.readUInt16();
        this.maxZones = data.readUInt16();
        this.maxTwilightPoints = data.readUInt16();
        this.maxStorage = data.readUInt16();
        this.maxFunctionDefs = data.readUInt16();
        this.maxInstructionDefs = data.readUInt16();
        this.maxStackElements = data.readUInt16();
        this.maxSizeOfInstructions = data.readUInt16();
        this.maxComponentElements = data.readUInt16();
        return this.maxComponentDepth = data.readUInt16();
      };
      /*MaxpTable.prototype.encode = function (ids) {
          var table;
          table = new Data;
          table.writeInt(this.version);
          table.writeUInt16(ids.length);
          table.writeUInt16(this.maxPoints);
          table.writeUInt16(this.maxContours);
          table.writeUInt16(this.maxCompositePoints);
          table.writeUInt16(this.maxComponentContours);
          table.writeUInt16(this.maxZones);
          table.writeUInt16(this.maxTwilightPoints);
          table.writeUInt16(this.maxStorage);
          table.writeUInt16(this.maxFunctionDefs);
          table.writeUInt16(this.maxInstructionDefs);
          table.writeUInt16(this.maxStackElements);
          table.writeUInt16(this.maxSizeOfInstructions);
          table.writeUInt16(this.maxComponentElements);
          table.writeUInt16(this.maxComponentDepth);
          return table.data;
      };*/


      return MaxpTable;
    }(Table);

    var HmtxTable = function (_super) {
      __extends(HmtxTable, _super);

      function HmtxTable() {
        return HmtxTable.__super__.constructor.apply(this, arguments);
      }

      HmtxTable.prototype.tag = 'hmtx';

      HmtxTable.prototype.parse = function (data) {
        var i, last, lsbCount, m, _i, _j, _ref, _results;

        data.pos = this.offset;
        this.metrics = [];

        for (i = _i = 0, _ref = this.file.hhea.numberOfMetrics; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          this.metrics.push({
            advance: data.readUInt16(),
            lsb: data.readInt16()
          });
        }

        lsbCount = this.file.maxp.numGlyphs - this.file.hhea.numberOfMetrics;

        this.leftSideBearings = function () {
          var _j, _results;

          _results = [];

          for (i = _j = 0; 0 <= lsbCount ? _j < lsbCount : _j > lsbCount; i = 0 <= lsbCount ? ++_j : --_j) {
            _results.push(data.readInt16());
          }

          return _results;
        }();

        this.widths = function () {
          var _j, _len, _ref1, _results;

          _ref1 = this.metrics;
          _results = [];

          for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
            m = _ref1[_j];

            _results.push(m.advance);
          }

          return _results;
        }.call(this);

        last = this.widths[this.widths.length - 1];
        _results = [];

        for (i = _j = 0; 0 <= lsbCount ? _j < lsbCount : _j > lsbCount; i = 0 <= lsbCount ? ++_j : --_j) {
          _results.push(this.widths.push(last));
        }

        return _results;
      };
      /***************************************************************/

      /* function : forGlyph                                         */

      /* comment : Returns the advance width and lsb for this glyph. */

      /***************************************************************/


      HmtxTable.prototype.forGlyph = function (id) {
        var metrics;

        if (id in this.metrics) {
          return this.metrics[id];
        }

        return metrics = {
          advance: this.metrics[this.metrics.length - 1].advance,
          lsb: this.leftSideBearings[id - this.metrics.length]
        };
      };
      /*HmtxTable.prototype.encode = function (mapping) {
          var id, metric, table, _i, _len;
          table = new Data;
          for (_i = 0, _len = mapping.length; _i < _len; _i++) {
              id = mapping[_i];
              metric = this.forGlyph(id);
              table.writeUInt16(metric.advance);
              table.writeUInt16(metric.lsb);
          }
          return table.data;
      };*/


      return HmtxTable;
    }(Table);

    var __slice = [].slice;

    var GlyfTable = function (_super) {
      __extends(GlyfTable, _super);

      function GlyfTable() {
        return GlyfTable.__super__.constructor.apply(this, arguments);
      }

      GlyfTable.prototype.tag = 'glyf';

      GlyfTable.prototype.parse = function (data) {
        return this.cache = {};
      };

      GlyfTable.prototype.glyphFor = function (id) {
        id = id;
        var data, index, length, loca, numberOfContours, raw, xMax, xMin, yMax, yMin;

        if (id in this.cache) {
          return this.cache[id];
        }

        loca = this.file.loca;
        data = this.file.contents;
        index = loca.indexOf(id);
        length = loca.lengthOf(id);

        if (length === 0) {
          return this.cache[id] = null;
        }

        data.pos = this.offset + index;
        raw = new Data(data.read(length));
        numberOfContours = raw.readShort();
        xMin = raw.readShort();
        yMin = raw.readShort();
        xMax = raw.readShort();
        yMax = raw.readShort();

        if (numberOfContours === -1) {
          this.cache[id] = new CompoundGlyph(raw, xMin, yMin, xMax, yMax);
        } else {
          this.cache[id] = new SimpleGlyph(raw, numberOfContours, xMin, yMin, xMax, yMax);
        }

        return this.cache[id];
      };

      GlyfTable.prototype.encode = function (glyphs, mapping, old2new) {
        var glyph, id, offsets, table, _i, _len;

        table = [];
        offsets = [];

        for (_i = 0, _len = mapping.length; _i < _len; _i++) {
          id = mapping[_i];
          glyph = glyphs[id];
          offsets.push(table.length);

          if (glyph) {
            table = table.concat(glyph.encode(old2new));
          }
        }

        offsets.push(table.length);
        return {
          table: table,
          offsets: offsets
        };
      };

      return GlyfTable;
    }(Table);

    var SimpleGlyph = function () {
      /**************************************************************************/

      /* function : SimpleGlyph                                                 */

      /* comment : Stores raw, xMin, yMin, xMax, and yMax values for this glyph.*/

      /**************************************************************************/
      function SimpleGlyph(raw, numberOfContours, xMin, yMin, xMax, yMax) {
        this.raw = raw;
        this.numberOfContours = numberOfContours;
        this.xMin = xMin;
        this.yMin = yMin;
        this.xMax = xMax;
        this.yMax = yMax;
        this.compound = false;
      }

      SimpleGlyph.prototype.encode = function () {
        return this.raw.data;
      };

      return SimpleGlyph;
    }();

    var CompoundGlyph = function () {
      var ARG_1_AND_2_ARE_WORDS, MORE_COMPONENTS, WE_HAVE_AN_X_AND_Y_SCALE, WE_HAVE_A_SCALE, WE_HAVE_A_TWO_BY_TWO;
      ARG_1_AND_2_ARE_WORDS = 0x0001;
      WE_HAVE_A_SCALE = 0x0008;
      MORE_COMPONENTS = 0x0020;
      WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
      WE_HAVE_A_TWO_BY_TWO = 0x0080;
      /********************************************************************************************************************/

      /* function : CompoundGlypg generator                                                                               */

      /* comment : It stores raw, xMin, yMin, xMax, yMax, glyph id, and glyph offset for the corresponding compound glyph.*/

      /********************************************************************************************************************/

      function CompoundGlyph(raw, xMin, yMin, xMax, yMax) {
        var data, flags;
        this.raw = raw;
        this.xMin = xMin;
        this.yMin = yMin;
        this.xMax = xMax;
        this.yMax = yMax;
        this.compound = true;
        this.glyphIDs = [];
        this.glyphOffsets = [];
        data = this.raw;

        while (true) {
          flags = data.readShort();
          this.glyphOffsets.push(data.pos);
          this.glyphIDs.push(data.readShort());

          if (!(flags & MORE_COMPONENTS)) {
            break;
          }

          if (flags & ARG_1_AND_2_ARE_WORDS) {
            data.pos += 4;
          } else {
            data.pos += 2;
          }

          if (flags & WE_HAVE_A_TWO_BY_TWO) {
            data.pos += 8;
          } else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) {
            data.pos += 4;
          } else if (flags & WE_HAVE_A_SCALE) {
            data.pos += 2;
          }
        }
      }
      /****************************************************************************************************************/

      /* function : CompoundGlypg encode                                                                              */

      /* comment : After creating a table for the characters you typed, you call directory.encode to encode the table.*/

      /****************************************************************************************************************/


      CompoundGlyph.prototype.encode = function (mapping) {
        var i, id, result, _i, _len, _ref;

        result = new Data(__slice.call(this.raw.data));
        _ref = this.glyphIDs;

        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          id = _ref[i];
          result.pos = this.glyphOffsets[i];
        }

        return result.data;
      };

      return CompoundGlyph;
    }();

    var LocaTable = function (_super) {
      __extends(LocaTable, _super);

      function LocaTable() {
        return LocaTable.__super__.constructor.apply(this, arguments);
      }

      LocaTable.prototype.tag = 'loca';

      LocaTable.prototype.parse = function (data) {
        var format, i;
        data.pos = this.offset;
        format = this.file.head.indexToLocFormat;

        if (format === 0) {
          return this.offsets = function () {
            var _i, _ref, _results;

            _results = [];

            for (i = _i = 0, _ref = this.length; _i < _ref; i = _i += 2) {
              _results.push(data.readUInt16() * 2);
            }

            return _results;
          }.call(this);
        } else {
          return this.offsets = function () {
            var _i, _ref, _results;

            _results = [];

            for (i = _i = 0, _ref = this.length; _i < _ref; i = _i += 4) {
              _results.push(data.readUInt32());
            }

            return _results;
          }.call(this);
        }
      };

      LocaTable.prototype.indexOf = function (id) {
        return this.offsets[id];
      };

      LocaTable.prototype.lengthOf = function (id) {
        return this.offsets[id + 1] - this.offsets[id];
      };

      LocaTable.prototype.encode = function (offsets, activeGlyphs) {
        var LocaTable = new Uint32Array(this.offsets.length);
        var glyfPtr = 0;
        var listGlyf = 0;

        for (var k = 0; k < LocaTable.length; ++k) {
          LocaTable[k] = glyfPtr;

          if (listGlyf < activeGlyphs.length && activeGlyphs[listGlyf] == k) {
            ++listGlyf;
            LocaTable[k] = glyfPtr;
            var start = this.offsets[k];
            var len = this.offsets[k + 1] - start;

            if (len > 0) {
              glyfPtr += len;
            }
          }
        }

        var newLocaTable = new Array(LocaTable.length * 4);

        for (var j = 0; j < LocaTable.length; ++j) {
          newLocaTable[4 * j + 3] = LocaTable[j] & 0x000000ff;
          newLocaTable[4 * j + 2] = (LocaTable[j] & 0x0000ff00) >> 8;
          newLocaTable[4 * j + 1] = (LocaTable[j] & 0x00ff0000) >> 16;
          newLocaTable[4 * j] = (LocaTable[j] & 0xff000000) >> 24;
        }

        return newLocaTable;
      };

      return LocaTable;
    }(Table);
    /************************************************************************************/

    /* function : invert                                                                */

    /* comment : Change the object's (key: value) to create an object with (value: key).*/

    /************************************************************************************/


    var invert = function invert(object) {
      var key, ret, val;
      ret = {};

      for (key in object) {
        val = object[key];
        ret[val] = key;
      }

      return ret;
    };
    /*var successorOf = function (input) {
        var added, alphabet, carry, i, index, isUpperCase, last, length, next, result;
        alphabet = 'abcdefghijklmnopqrstuvwxyz';
        length = alphabet.length;
        result = input;
        i = input.length;
        while (i >= 0) {
            last = input.charAt(--i);
            if (isNaN(last)) {
                index = alphabet.indexOf(last.toLowerCase());
                if (index === -1) {
                    next = last;
                    carry = true;
                }
                else {
                    next = alphabet.charAt((index + 1) % length);
                    isUpperCase = last === last.toUpperCase();
                    if (isUpperCase) {
                        next = next.toUpperCase();
                    }
                    carry = index + 1 >= length;
                    if (carry && i === 0) {
                        added = isUpperCase ? 'A' : 'a';
                        result = added + next + result.slice(1);
                        break;
                    }
                }
            }
            else {
                next = +last + 1;
                carry = next > 9;
                if (carry) {
                    next = 0;
                }
                if (carry && i === 0) {
                    result = '1' + next + result.slice(1);
                    break;
                }
            }
            result = result.slice(0, i) + next + result.slice(i + 1);
            if (!carry) {
                break;
            }
        }
        return result;
    };*/


    var Subset = function () {
      function Subset(font) {
        this.font = font;
        this.subset = {};
        this.unicodes = {};
        this.next = 33;
      }
      /*Subset.prototype.use = function (character) {
          var i, _i, _ref;
          if (typeof character === 'string') {
              for (i = _i = 0, _ref = character.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
                  this.use(character.charCodeAt(i));
              }
              return;
          }
          if (!this.unicodes[character]) {
              this.subset[this.next] = character;
              return this.unicodes[character] = this.next++;
          }
      };*/

      /*Subset.prototype.encodeText = function (text) {
          var char, i, string, _i, _ref;
          string = '';
          for (i = _i = 0, _ref = text.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
              char = this.unicodes[text.charCodeAt(i)];
              string += String.fromCharCode(char);
          }
          return string;
      };*/

      /***************************************************************/

      /* function : generateCmap                                     */

      /* comment : Returns the unicode cmap for this font.         */

      /***************************************************************/


      Subset.prototype.generateCmap = function () {
        var mapping, roman, unicode, unicodeCmap, _ref;

        unicodeCmap = this.font.cmap.tables[0].codeMap;
        mapping = {};
        _ref = this.subset;

        for (roman in _ref) {
          unicode = _ref[roman];
          mapping[roman] = unicodeCmap[unicode];
        }

        return mapping;
      };
      /*Subset.prototype.glyphIDs = function () {
          var ret, roman, unicode, unicodeCmap, val, _ref;
          unicodeCmap = this.font.cmap.tables[0].codeMap;
          ret = [0];
          _ref = this.subset;
          for (roman in _ref) {
              unicode = _ref[roman];
              val = unicodeCmap[unicode];
              if ((val != null) && __indexOf.call(ret, val) < 0) {
                  ret.push(val);
              }
          }
          return ret.sort();
      };*/

      /******************************************************************/

      /* function : glyphsFor                                           */

      /* comment : Returns simple glyph objects for the input character.*/

      /******************************************************************/


      Subset.prototype.glyphsFor = function (glyphIDs) {
        var additionalIDs, glyph, glyphs, id, _i, _len, _ref;

        glyphs = {};

        for (_i = 0, _len = glyphIDs.length; _i < _len; _i++) {
          id = glyphIDs[_i];
          glyphs[id] = this.font.glyf.glyphFor(id);
        }

        additionalIDs = [];

        for (id in glyphs) {
          glyph = glyphs[id];

          if (glyph != null ? glyph.compound : void 0) {
            additionalIDs.push.apply(additionalIDs, glyph.glyphIDs);
          }
        }

        if (additionalIDs.length > 0) {
          _ref = this.glyphsFor(additionalIDs);

          for (id in _ref) {
            glyph = _ref[id];
            glyphs[id] = glyph;
          }
        }

        return glyphs;
      };
      /***************************************************************/

      /* function : encode                                           */

      /* comment : Encode various tables for the characters you use. */

      /***************************************************************/


      Subset.prototype.encode = function (glyID, indexToLocFormat) {
        var cmap, code, glyf, glyphs, id, ids, loca, new2old, newIDs, nextGlyphID, old2new, oldID, oldIDs, tables, _ref;

        cmap = CmapTable.encode(this.generateCmap(), 'unicode');
        glyphs = this.glyphsFor(glyID);
        old2new = {
          0: 0
        };
        _ref = cmap.charMap;

        for (code in _ref) {
          ids = _ref[code];
          old2new[ids.old] = ids["new"];
        }

        nextGlyphID = cmap.maxGlyphID;

        for (oldID in glyphs) {
          if (!(oldID in old2new)) {
            old2new[oldID] = nextGlyphID++;
          }
        }

        new2old = invert(old2new);
        newIDs = Object.keys(new2old).sort(function (a, b) {
          return a - b;
        });

        oldIDs = function () {
          var _i, _len, _results;

          _results = [];

          for (_i = 0, _len = newIDs.length; _i < _len; _i++) {
            id = newIDs[_i];

            _results.push(new2old[id]);
          }

          return _results;
        }();

        glyf = this.font.glyf.encode(glyphs, oldIDs, old2new);
        loca = this.font.loca.encode(glyf.offsets, oldIDs);
        tables = {
          cmap: this.font.cmap.raw(),
          glyf: glyf.table,
          loca: loca,
          hmtx: this.font.hmtx.raw(),
          hhea: this.font.hhea.raw(),
          maxp: this.font.maxp.raw(),
          post: this.font.post.raw(),
          name: this.font.name.raw(),
          head: this.font.head.encode(indexToLocFormat)
        };

        if (this.font.os2.exists) {
          tables['OS/2'] = this.font.os2.raw();
        }

        return this.font.directory.encode(tables);
      };

      return Subset;
    }();

    jsPDF.API.PDFObject = function () {
      var pad;

      function PDFObject() {}

      pad = function pad(str, length) {
        return (Array(length + 1).join('0') + str).slice(-length);
      };
      /*****************************************************************************/

      /* function : convert                                                        */

      /* comment :Converts pdf tag's / FontBBox and array values in / W to strings */

      /*****************************************************************************/


      PDFObject.convert = function (object) {
        var e, items, key, out, val;

        if (Array.isArray(object)) {
          items = function () {
            var _i, _len, _results;

            _results = [];

            for (_i = 0, _len = object.length; _i < _len; _i++) {
              e = object[_i];

              _results.push(PDFObject.convert(e));
            }

            return _results;
          }().join(' ');

          return '[' + items + ']';
        } else if (typeof object === 'string') {
          return '/' + object;
        } else if (object != null ? object.isString : void 0) {
          return '(' + object + ')';
        } else if (object instanceof Date) {
          return '(D:' + pad(object.getUTCFullYear(), 4) + pad(object.getUTCMonth(), 2) + pad(object.getUTCDate(), 2) + pad(object.getUTCHours(), 2) + pad(object.getUTCMinutes(), 2) + pad(object.getUTCSeconds(), 2) + 'Z)';
        } else if ({}.toString.call(object) === '[object Object]') {
          out = ['<<'];

          for (key in object) {
            val = object[key];
            out.push('/' + key + ' ' + PDFObject.convert(val));
          }

          out.push('>>');
          return out.join('\n');
        } else {
          return '' + object;
        }
      };

      return PDFObject;
    }();
  })(jsPDF);

  //import './src/license.js';
  //import './src/libs/zlib.js';

}));

try {
module.exports = jsPDF;
}
catch (e) {}
