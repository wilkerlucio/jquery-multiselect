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
    BACKSPACE: 8,
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
      separator: ",",
      completions: [],
      max_complete_results: 5,
      enable_new_options: true
    };
    $.extend(this.options, options || {});
    this.values = [];
    this.input = $(element);
    this.initialize_elements();
    this.initialize_events();
    this.parse_value();
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
    this.autocomplete = new $.MultiSelect.AutoComplete(this, this.options.completions);
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
        return this.parse_value(1);
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
    this.observer.bind([KEY.TAB, KEY.RETURN], (function(__this) {
      var __func = function(e) {
        if (this.autocomplete.val()) {
          e.preventDefault();
          return this.add_and_reset();
        }
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
    return this.observer.bind([KEY.BACKSPACE], (function(__this) {
      var __func = function(e) {
        var caret;
        if (this.values.length <= 0) {
          return null;
        }
        caret = this.selection.get_caret();
        if (caret[0] === 0 && caret[1] === 0) {
          e.preventDefault();
          return this.remove(this.values[this.values.length - 1]);
        }
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
  };
  $.MultiSelect.prototype.values_real = function values_real() {
    return $.map(this.values, function(v) {
      return v[1];
    });
  };
  $.MultiSelect.prototype.parse_value = function parse_value(min) {
    var _a, _b, _c, value, values;
    min = (typeof min !== "undefined" && min !== null) ? min : 0;
    values = this.input.val().split(this.options.separator);
    if (values.length > min) {
      _b = values;
      for (_a = 0, _c = _b.length; _a < _c; _a++) {
        value = _b[_a];
        if (value.present()) {
          this.add([value, value]);
        }
      }
      this.input.val("");
      return this.autocomplete.search();
    }
  };
  $.MultiSelect.prototype.add_and_reset = function add_and_reset() {
    if (this.autocomplete.val()) {
      this.add(this.autocomplete.val());
      this.input.val("");
      return this.autocomplete.search();
    }
  };
  // add new element
  $.MultiSelect.prototype.add = function add(value) {
    var a, close;
    if ($.inArray(value[1], this.values_real()) > -1) {
      return null;
    }
    if (value[0].blank()) {
      return null;
    }
    value[1] = value[1].trim();
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
    a.html(value[0].entitizeHTML());
    close = $(document.createElement("a"));
    close.addClass("closebutton");
    close.click((function(__this) {
      var __func = function() {
        return this.remove(a.data("value"));
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
    console.log(this.values);
    this.values = $.grep(this.values, function(v) {
      return v[1] !== value[1];
    });
    this.container.find("a.bit-box").each(function() {
      if ($(this).data("value")[1] === value[1]) {
        return $(this).remove();
      }
    });
    return this.refresh_hidden();
  };
  $.MultiSelect.prototype.refresh_hidden = function refresh_hidden() {
    return this.hidden.val(this.values_real().join(this.options.separator));
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
  $.MultiSelect.Selection = function Selection(element) {
    this.input = $(element)[0];
    return this;
  };
  $.MultiSelect.Selection.prototype.get_caret = function get_caret() {
    var r;
    // For IE
    if (document.selection) {
      r = document.selection.createRange().duplicate();
      r.moveEnd('character', this.input.value.length);
      if (r.text === '') {
        return [this.input.value.length, this.input.value.length];
      } else {
        return [this.input.value.lastIndexOf(r.text), this.input.value.lastIndexOf(r.text)];
        // Others
      }
    } else {
      return [this.input.selectionStart, this.input.selectionEnd];
    }
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
    return this.measurer.innerWidth();
  };
  $.MultiSelect.ResizableInput.prototype.set_width = function set_width() {
    return this.input.css("width", this.calculate_width() + "px");
  };
  // AutoComplete Helper
  $.MultiSelect.AutoComplete = function AutoComplete(multiselect, completions) {
    this.multiselect = multiselect;
    this.input = this.multiselect.input;
    this.completions = this.parse_completions(completions);
    this.matches = [];
    this.create_elements();
    this.bind_events();
    return this;
  };
  $.MultiSelect.AutoComplete.prototype.parse_completions = function parse_completions(completions) {
    return $.map(completions, function(value) {
      if (typeof value === "string") {
        return [[value, value]];
      } else if (value instanceof Array && value.length === 2) {
        return [value];
      } else if (value.value && value.caption) {
        return [[value.caption, value.value]];
      } else if (console) {
        return console.error("Invalid option " + (value));
      }
    });
  };
  $.MultiSelect.AutoComplete.prototype.create_elements = function create_elements() {
    this.container = $(document.createElement("div"));
    this.container.addClass("jquery-multiselect-autocomplete");
    this.container.css("width", this.multiselect.container.outerWidth());
    this.container.css("display", "none");
    this.container.append(this.def);
    this.list = $(document.createElement("ul"));
    this.list.addClass("feed");
    this.container.append(this.list);
    return this.multiselect.container.after(this.container);
  };
  $.MultiSelect.AutoComplete.prototype.bind_events = function bind_events() {
    this.input.keypress((function(func, obj, args) {
      return function() {
        return func.apply(obj, args.concat(Array.prototype.slice.call(arguments, 0)));
      };
    }(this.search, this, [])));
    this.input.keyup((function(func, obj, args) {
      return function() {
        return func.apply(obj, args.concat(Array.prototype.slice.call(arguments, 0)));
      };
    }(this.search, this, [])));
    this.input.change((function(func, obj, args) {
      return function() {
        return func.apply(obj, args.concat(Array.prototype.slice.call(arguments, 0)));
      };
    }(this.search, this, [])));
    this.multiselect.observer.bind(KEY.UP, (function(__this) {
      var __func = function(e) {
        e.preventDefault();
        return this.navigate_up();
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
    return this.multiselect.observer.bind(KEY.DOWN, (function(__this) {
      var __func = function(e) {
        e.preventDefault();
        return this.navigate_down();
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
  };
  $.MultiSelect.AutoComplete.prototype.search = function search() {
    var _a, _b, def, i, item, option;
    if (this.input.val().trim() === this.query) {
      return null;
    }
    // dont do operation if query is same
    this.query = this.input.val().trim();
    this.list.html("");
    // clear list
    this.current = 0;
    if (this.query.present()) {
      this.container.css("display", "block");
      this.matches = this.matching_completions(this.query);
      if (this.multiselect.options.enable_new_options) {
        def = this.create_item("Add <em>" + this.query + "</em>");
        def.mouseover((function(func, obj, args) {
          return function() {
            return func.apply(obj, args.concat(Array.prototype.slice.call(arguments, 0)));
          };
        }(this.select_index, this, [0])));
      }
      _a = this.matches;
      for (i = 0, _b = _a.length; i < _b; i++) {
        option = _a[i];
        item = this.create_item(this.highlight(option[0], this.query));
        item.mouseover((function(func, obj, args) {
          return function() {
            return func.apply(obj, args.concat(Array.prototype.slice.call(arguments, 0)));
          };
        }(this.select_index, this, [i + 1])));
      }
      if (this.multiselect.options.enable_new_options) {
        this.matches.unshift([this.query, this.query]);
      }
      return this.select_index(0);
    } else {
      this.matches = [];
      this.container.css("display", "none");
      this.query = null;
      return this.query;
    }
  };
  $.MultiSelect.AutoComplete.prototype.select_index = function select_index(index) {
    var items;
    items = this.list.find("li");
    items.removeClass("auto-focus");
    items.filter(":eq(" + (index) + ")").addClass("auto-focus");
    this.current = index;
    return this.current;
  };
  $.MultiSelect.AutoComplete.prototype.navigate_down = function navigate_down() {
    var next;
    next = this.current + 1;
    if (next >= this.matches.length) {
      next = 0;
    }
    return this.select_index(next);
  };
  $.MultiSelect.AutoComplete.prototype.navigate_up = function navigate_up() {
    var next;
    next = this.current - 1;
    if (next < 0) {
      next = this.matches.length - 1;
    }
    return this.select_index(next);
  };
  $.MultiSelect.AutoComplete.prototype.create_item = function create_item(text, highlight) {
    var item;
    item = $(document.createElement("li"));
    item.click((function(__this) {
      var __func = function() {
        this.multiselect.add_and_reset();
        this.search();
        return this.input.focus();
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
    item.html(text);
    this.list.append(item);
    return item;
  };
  $.MultiSelect.AutoComplete.prototype.val = function val() {
    return this.matches[this.current];
  };
  $.MultiSelect.AutoComplete.prototype.highlight = function highlight(text, highlight) {
    var reg;
    reg = "(" + (RegExp.escape(highlight)) + ")";
    return text.replace(new RegExp(reg, "gi"), '<em>$1</em>');
  };
  $.MultiSelect.AutoComplete.prototype.matching_completions = function matching_completions(text) {
    var count, reg;
    reg = new RegExp(RegExp.escape(text), "i");
    count = 0;
    return $.grep(this.completions, (function(__this) {
      var __func = function(c) {
        if (count >= this.multiselect.options.max_complete_results) {
          return false;
        }
        if ($.inArray(c[1], this.multiselect.values_real()) > -1) {
          return false;
        }
        if (c[0].match(reg)) {
          count++;
          return true;
        } else {
          return false;
        }
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
  };
  // Hook jQuery extension
  $.fn.multiselect = function multiselect(options) {
    options = (typeof options !== "undefined" && options !== null) ? options : {};
    return $(this).each(function() {
      return new $.MultiSelect(this, options);
    });
  };
  return $.fn.multiselect;
})(jQuery);
$.extend(String.prototype, {
  trim: function trim() {
    return this.replace(/^[\r\n\s]/g, '').replace(/[\r\n\s]$/g, '');
  },
  entitizeHTML: function entitizeHTML() {
    return this.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
  unentitizeHTML: function unentitizeHTML() {
    return this.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  },
  blank: function blank() {
    return this.trim().length === 0;
  },
  present: function present() {
    return !this.blank();
  }
});
RegExp.escape = function escape(str) {
  return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};