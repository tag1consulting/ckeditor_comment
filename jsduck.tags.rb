require "jsduck/tag/tag"

module JsDuck::Tag
  class Todo < Tag
    def initialize
      @pattern = "todo"
      @tagname = :todo
      @repeatable = true
      @signature = {:long => "todo", :short => "todo"}
      @html_position = POS_DOC + 0.1
      @css = <<-EOCSS
        .signature .todo {
          background: #66ab16;
        }
        .class-overview .x-panel-body .todo ol {
          margin: 0;
          padding: .5em 2.5em;
        }
      EOCSS
    end

    def parse_doc(scanner, position)
      text = scanner.match(/.*$/)
      return { :tagname => :todo, :text => text }
    end

    def process_doc(context, todo_tags, position)
      context[:todo] = todo_tags.map {|tag| tag[:text] }
    end

    def to_html(context)
      todo = context[:todo].map {|todo| "#{todo}" }.join("</li><li>")
      <<-EOHTML
        <pre class="notpretty todo"><h4>To-do:</h4><ol><li>#{todo}</li></ol></pre>
      EOHTML
    end
  end
end
