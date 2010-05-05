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
      }
      $.extend(@options, options || {})
      @values: []
      @input: $(element)
      @initialize_elements()
      @initialize_events()
    
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
      @selection = new $.MultiSelect.Selection(@input)
      @observer = new $.MultiSelect.InputObserver(@input)
      
      # prevent container click to put carret at end
      @input.click (e) =>
        e.stopPropagation()
      
      # create element when place separator or paste
      @input.keyup =>
        values = @input.val().split(@options.separator)
        
        if values.length > 1
          for value in values
            @add value if value.length > 0
          
          @input.val("")
      
      # focus input and set carret at and
      @container.click =>
        @input.focus()
        @selection.set_caret_at_end()
      
      # add element on press TAB or RETURN
      @observer.bind [KEY.TAB, KEY.RETURN], (e) =>
        e.preventDefault()
        @add(@input.val())
        @input.val("")
    
    # add new element
    add: (value) ->
      return if $.inArray(value, @values) > -1
      
      @values.push(value)
      
      a: $(document.createElement("a"))
      a.addClass("bit bit-box")
      a.mouseover -> $(this).addClass("bit-hover")
      a.mouseout -> $(this).removeClass("bit-hover")
      a.data("value", value)
      a.html(value)
      
      close: $(document.createElement("a"))
      close.addClass("closebutton")
      close.click =>
        @remove(a.data("value"))
        a.remove()
      a.append(close)
      
      @input_wrapper.before(a)
      @refresh_hidden()
    
    remove: (value) ->
      console.log(value)
      @values = $.grep @values, (v) -> v != value
      console.log(@values)
      @refresh_hidden()
    
    refresh_hidden: ->
      @hidden.val(@values.join(@options.separator))
    
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
  
  class $.MultiSelect.Selection
    constructor: (element) ->
      @input: $(element)[0]
    
    get_caret: ->
      [@input.selectionStart, @input.selectionEnd]
    
    set_caret: (begin, end) ->
      end ?= begin
      @input.selectionStart = begin
      @input.selectionEnd = end
    
    set_caret_at_end: ->
      @set_caret(@input.value.length)
  
  $.fn.multiselect = (options) ->
    options ?= {}
    
    $(this).each ->
      new $.MultiSelect(this, options)
)(jQuery)