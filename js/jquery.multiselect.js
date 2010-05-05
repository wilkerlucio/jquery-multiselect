// Copyright (c) 2010 Wilker Lúcio
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
(function($) {
  var KEY;
  KEY = {
    TAB: 9,
    RETURN: 13,
    ESCAPE: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    COLON: 188,
    DOT: 190
  };
  $.MultiSelect = function MultiSelect(element, options) {
    this.options = {
      separator: ","
    };
    $.extend(this.options, options || {});
    this.values = [];
    this.input = $(element);
    this.initialize_elements();
    this.initialize_events();
    return this;
  };
  $.MultiSelect.prototype.initialize_elements = function initialize_elements() {
    // hidden input to hold real value
    this.hidden = $(document.createElement("input"));
    this.hidden.attr("name", this.input.attr("name"));
    this.hidden.attr("type", "hidden");
    this.input.removeAttr("name");
    this.container = $(document.createElement("div"));
    this.container.addClass("jquery-multiselect");
    this.input_wrapper = $(document.createElement("a"));
    this.input_wrapper.addClass("bit-input");
    this.input.replaceWith(this.container);
    this.container.append(this.input_wrapper);
    this.input_wrapper.append(this.input);
    return this.container.before(this.hidden);
  };
  $.MultiSelect.prototype.initialize_events = function initialize_events() {
    // create helpers
    this.selection = new $.MultiSelect.Selection(this.input);
    this.resizable = new $.MultiSelect.ResizableInput(this.input);
    this.observer = new $.MultiSelect.InputObserver(this.input);
    // prevent container click to put carret at end
    this.input.click((function(__this) {
      var __func = function(e) {
        return e.stopPropagation();
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
    // create element when place separator or paste
    this.input.keyup((function(__this) {
      var __func = function() {
        var _a, _b, _c, value, values;
        values = this.input.val().split(this.options.separator);
        if (values.length > 1) {
          _b = values;
          for (_a = 0, _c = _b.length; _a < _c; _a++) {
            value = _b[_a];
            if (value.length > 0) {
              this.add(value);
            }
          }
          return this.input.val("");
        }
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
    // focus input and set carret at and
    this.container.click((function(__this) {
      var __func = function() {
        this.input.focus();
        return this.selection.set_caret_at_end();
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
    // add element on press TAB or RETURN
    return this.observer.bind([KEY.TAB, KEY.RETURN], (function(__this) {
      var __func = function(e) {
        e.preventDefault();
        this.add(this.input.val());
        return this.input.val("");
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
  };
  // add new element
  $.MultiSelect.prototype.add = function add(value) {
    var a, close;
    if ($.inArray(value, this.values) > -1) {
      return null;
    }
    this.values.push(value);
    a = $(document.createElement("a"));
    a.addClass("bit bit-box");
    a.mouseover(function() {
      return $(this).addClass("bit-hover");
    });
    a.mouseout(function() {
      return $(this).removeClass("bit-hover");
    });
    a.data("value", value);
    a.html(value.entitizeHTML());
    close = $(document.createElement("a"));
    close.addClass("closebutton");
    close.click((function(__this) {
      var __func = function() {
        this.remove(a.data("value"));
        return a.remove();
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
    a.append(close);
    this.input_wrapper.before(a);
    return this.refresh_hidden();
  };
  $.MultiSelect.prototype.remove = function remove(value) {
    console.log(value);
    this.values = $.grep(this.values, function(v) {
      return v !== value;
    });
    console.log(this.values);
    return this.refresh_hidden();
  };
  $.MultiSelect.prototype.refresh_hidden = function refresh_hidden() {
    return this.hidden.val(this.values.join(this.options.separator));
  };
  // Input Observer Helper
  $.MultiSelect.InputObserver = function InputObserver(element) {
    this.input = $(element);
    this.input.keydown((function(func, obj, args) {
      return function() {
        return func.apply(obj, args.concat(Array.prototype.slice.call(arguments, 0)));
      };
    }(this.handle_keydown, this, [])));
    this.events = [];
    return this;
  };
  $.MultiSelect.InputObserver.prototype.bind = function bind(key, callback) {
    return this.events.push([key, callback]);
  };
  $.MultiSelect.InputObserver.prototype.handle_keydown = function handle_keydown(e) {
    var _a, _b, _c, _d, _e, callback, event, keys;
    _a = []; _c = this.events;
    for (_b = 0, _d = _c.length; _b < _d; _b++) {
      event = _c[_b];
      _a.push((function() {
        _e = event;
        keys = _e[0];
        callback = _e[1];
        if (!(keys.push)) {
          keys = [keys];
        }
        if ($.inArray(e.keyCode, keys) > -1) {
          return callback(e);
        }
      }).call(this));
    }
    return _a;
  };
  // Selection Helper
  // TODO: support IE
  $.MultiSelect.Selection = function Selection(element) {
    this.input = $(element)[0];
    return this;
  };
  $.MultiSelect.Selection.prototype.get_caret = function get_caret() {
    return [this.input.selectionStart, this.input.selectionEnd];
  };
  $.MultiSelect.Selection.prototype.set_caret = function set_caret(begin, end) {
    end = (typeof end !== "undefined" && end !== null) ? end : begin;
    this.input.selectionStart = begin;
    this.input.selectionEnd = end;
    return this.input.selectionEnd;
  };
  $.MultiSelect.Selection.prototype.set_caret_at_end = function set_caret_at_end() {
    return this.set_caret(this.input.value.length);
  };
  // Resizable Input Helper
  $.MultiSelect.ResizableInput = function ResizableInput(element) {
    this.input = $(element);
    this.create_measurer();
    this.input.keypress((function(func, obj, args) {
      return function() {
        return func.apply(obj, args.concat(Array.prototype.slice.call(arguments, 0)));
      };
    }(this.set_width, this, [])));
    this.input.keyup((function(func, obj, args) {
      return function() {
        return func.apply(obj, args.concat(Array.prototype.slice.call(arguments, 0)));
      };
    }(this.set_width, this, [])));
    this.input.change((function(func, obj, args) {
      return function() {
        return func.apply(obj, args.concat(Array.prototype.slice.call(arguments, 0)));
      };
    }(this.set_width, this, [])));
    return this;
  };
  $.MultiSelect.ResizableInput.prototype.create_measurer = function create_measurer() {
    var measurer;
    if ($("#__jquery_multiselect_measurer")[0] === undefined) {
      measurer = $(document.createElement("div"));
      measurer.attr("id", "__jquery_multiselect_measurer");
      measurer.css({
        position: "absolute",
        left: "-1000px",
        top: "-1000px"
      });
      $(document.body).append(measurer);
    }
    this.measurer = $("#__jquery_multiselect_measurer:first");
    return this.measurer.css({
      fontSize: this.input.css('font-size'),
      fontFamily: this.input.css('font-family')
    });
  };
  $.MultiSelect.ResizableInput.prototype.calculate_width = function calculate_width() {
    this.measurer.html(this.input.val().entitizeHTML() + 'MM');
    return parseInt(this.measurer.css("width"));
  };
  $.MultiSelect.ResizableInput.prototype.set_width = function set_width() {
    return this.input.css("width", this.calculate_width() + "px");
  };
  $.fn.multiselect = function multiselect(options) {
    options = (typeof options !== "undefined" && options !== null) ? options : {};
    return $(this).each(function() {
      return new $.MultiSelect(this, options);
    });
  };
  return $.fn.multiselect;
})(jQuery);
$.extend(String.prototype, {
  entitizeHTML: function entitizeHTML() {
    return this.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
  unentitizeHTML: function unentitizeHTML() {
    return this.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }
});