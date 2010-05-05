# Copyright (c) 2010 Wilker Lúcio
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#    http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

(($) ->
  KEY: {
    BACKSPACE: 8
    TAB: 9
    RETURN: 13
    ESCAPE: 27
    SPACE: 32
    LEFT: 37
    UP: 38
    RIGHT: 39
    DOWN: 40
    COLON: 188
    DOT: 190
  }
  
  class $.MultiSelect
    constructor: (element, options) ->
      @options: {
        separator: ","
        completions: [],
        max_complete_results: 5
      }
      $.extend(@options, options || {})
      @values: []
      @input: $(element)
      @initialize_elements()
      @initialize_events()
      @parse_value()
    
    initialize_elements: ->
      # hidden input to hold real value
      @hidden: $(document.createElement("input"))
      @hidden.attr("name", @input.attr("name"))
      @hidden.attr("type", "hidden")
      @input.removeAttr("name")
      
      @container: $(document.createElement("div"))
      @container.addClass("jquery-multiselect")
      
      @input_wrapper: $(document.createElement("a"))
      @input_wrapper.addClass("bit-input")
      
      @input.replaceWith(@container)
      @container.append(@input_wrapper)
      @input_wrapper.append(@input)
      @container.before(@hidden)
    
    initialize_events: ->
      # create helpers
      @selection: new $.MultiSelect.Selection(@input)
      @resizable: new $.MultiSelect.ResizableInput(@input)
      @observer: new $.MultiSelect.InputObserver(@input)
      @autocomplete: new $.MultiSelect.AutoComplete(this, @options.completions)
      
      # prevent container click to put carret at end
      @input.click (e) =>
        e.stopPropagation()
      
      # create element when place separator or paste
      @input.keyup =>
        @parse_value(1)
      
      # focus input and set carret at and
      @container.click =>
        @input.focus()
        @selection.set_caret_at_end()
      
      # add element on press TAB or RETURN
      @observer.bind [KEY.TAB, KEY.RETURN], (e) =>
        e.preventDefault()
        @add_and_reset()
      
      @observer.bind [KEY.BACKSPACE], (e) =>
        return if @values.length <= 0
        caret = @selection.get_caret()
        
        if caret[0] == 0 and caret[1] == 0
          e.preventDefault()
          @remove(@values[@values.length - 1])
    
    parse_value: (min) ->
      min ?= 0
      values: @input.val().split(@options.separator)

      if values.length > min
        for value in values
          @add value if value.present()

        @input.val("")
        @autocomplete.search()
    
    add_and_reset: ->
      if @autocomplete.val()
        @add(@autocomplete.val())
        @input.val("")
    
    # add new element
    add: (value) ->
      return if $.inArray(value, @values) > -1
      return if value.blank()
      
      value = value.trim()
      @values.push(value)
      
      a: $(document.createElement("a"))
      a.addClass("bit bit-box")
      a.mouseover -> $(this).addClass("bit-hover")
      a.mouseout -> $(this).removeClass("bit-hover")
      a.data("value", value)
      a.html(value.entitizeHTML())
      
      close: $(document.createElement("a"))
      close.addClass("closebutton")
      close.click =>
        @remove(a.data("value"))
      a.append(close)
      
      @input_wrapper.before(a)
      @refresh_hidden()
    
    remove: (value) ->
      @values: $.grep @values, (v) -> v != value
      @container.find("a.bit-box").each ->
        $(this).remove() if $(this).data("value") == value
      @refresh_hidden()
    
    refresh_hidden: ->
      @hidden.val(@values.join(@options.separator))
  
  # Input Observer Helper
  class $.MultiSelect.InputObserver
    constructor: (element) ->
      @input: $(element)
      @input.keydown(@handle_keydown <- this)
      @events: []
    
    bind: (key, callback) ->
      @events.push([key, callback])
    
    handle_keydown: (e) ->
      for event in @events
        [keys, callback]: event
        keys: [keys] unless keys.push
        callback(e) if $.inArray(e.keyCode, keys) > -1
  
  # Selection Helper
  # TODO: support IE
  class $.MultiSelect.Selection
    constructor: (element) ->
      @input: $(element)[0]
    
    get_caret: ->
      # For IE
      if document.selection
        r: document.selection.createRange().duplicate()
        r.moveEnd('character', @input.value.length)
        
        if r.text == ''
          [@input.value.length, @input.value.length]
        else
          [@input.value.lastIndexOf(r.text), @input.value.lastIndexOf(r.text)]
      # Others
      else
        [@input.selectionStart, @input.selectionEnd]
    
    set_caret: (begin, end) ->
      end ?= begin
      @input.selectionStart: begin
      @input.selectionEnd: end
    
    set_caret_at_end: ->
      @set_caret(@input.value.length)
  
  # Resizable Input Helper
  class $.MultiSelect.ResizableInput
    constructor: (element) ->
      @input: $(element)
      @create_measurer()
      @input.keypress(@set_width <- this)
      @input.keyup(@set_width <- this)
      @input.change(@set_width <- this)
    
    create_measurer: ->
      if $("#__jquery_multiselect_measurer")[0] == undefined
        measurer: $(document.createElement("div"))
        measurer.attr("id", "__jquery_multiselect_measurer")
        measurer.css {
          position: "absolute"
          left: "-1000px"
          top: "-1000px"
        }
        
        $(document.body).append(measurer)
      
      @measurer: $("#__jquery_multiselect_measurer:first")
      @measurer.css {
        fontSize: @input.css('font-size')
        fontFamily: @input.css('font-family')
      }
    
    calculate_width: ->  
      @measurer.html(@input.val().entitizeHTML() + 'MM')
      @measurer.innerWidth()
    
    set_width: ->
      @input.css("width", @calculate_width() + "px")
  
  # AutoComplete Helper
  class $.MultiSelect.AutoComplete
    constructor: (multiselect, completions) ->
      @multiselect: multiselect
      @input: @multiselect.input
      @completions: completions
      @matches: []
      @create_elements()
      @bind_events()
    
    create_elements: ->
      @container: $(document.createElement("div"))
      @container.addClass("jquery-multiselect-autocomplete")
      @container.css("width", @multiselect.container.outerWidth())
      @container.css("display", "none")
      
      @container.append(@def)
      
      @list: $(document.createElement("ul"))
      @list.addClass("feed")
      
      @container.append(@list)
      @multiselect.container.after(@container)
    
    bind_events: ->
      @input.keypress(@search <- this)
      @input.keyup(@search <- this)
      @input.change(@search <- this)
      @multiselect.observer.bind KEY.UP, (e) => e.preventDefault(); @navigate_up()
      @multiselect.observer.bind KEY.DOWN, (e) => e.preventDefault(); @navigate_down()
    
    search: ->
      return if @input.val().trim() == @query # dont do operation if query is same
      
      @query: @input.val().trim()
      @list.html("") # clear list
      @current: 0
      
      if @query.present()
        @container.css("display", "block")
        @matches: @matching_completions(@query)
        
        def: @create_item("Add <em>" + @query + "</em>")
        def.mouseover(@select_index <- this, 0)
        
        for option, i in @matches
          item: @create_item(@highlight(option, @query))
          item.mouseover(@select_index <- this, i + 1)
        
        @matches.unshift(@query)
        @select_index(0)
      else
        @container.css("display", "none")
        @query: null
    
    select_index: (index) ->
      items: @list.find("li")
      items.removeClass("auto-focus")
      items.filter(":eq(${index})").addClass("auto-focus")
      
      @current: index
    
    navigate_down: ->
      next: @current + 1
      next: 0 if next >= @matches.length
      @select_index(next)
    
    navigate_up: ->
      next: @current - 1
      next: @matches.length - 1 if next < 0
      @select_index(next)
    
    create_item: (text, highlight) ->
      item: $(document.createElement("li"))
      item.click =>
        @multiselect.add_and_reset()
        @search()
        @input.focus()
      item.html(text)
      @list.append(item)
      item
    
    val: ->
      @matches[@current]
    
    highlight: (text, highlight) ->
      reg: "(${RegExp.escape(highlight)})"
      text.replace(new RegExp(reg, "gi"), '<em>$1</em>')
    
    matching_completions: (text) ->
      reg: new RegExp(RegExp.escape(text), "i")
      count: 0
      $.grep @completions, (c) =>
        return false if count >= @multiselect.options.max_complete_results
        return false if $.inArray(c, @multiselect.values) > -1
        
        if c.match(reg)
          count++
          true
        else
          false
  
  # Hook jQuery extension
  $.fn.multiselect: (options) ->
    options ?= {}
    
    $(this).each ->
      new $.MultiSelect(this, options)
)(jQuery)

$.extend String.prototype, {
  trim: -> this.replace(/^[\r\n\s]/g, '').replace(/[\r\n\s]$/g, '')
  entitizeHTML: -> this.replace(/</g,'&lt;').replace(/>/g,'&gt;')
  unentitizeHTML: -> this.replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  blank: -> this.trim().length == 0
  present: -> not @blank()
};

RegExp.escape: (str) ->
  String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
