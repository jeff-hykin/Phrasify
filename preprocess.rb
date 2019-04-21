require "csv"
require "i18n"

# setup language
I18n.available_locales = [:en]

CSV.foreach("./docs.csv") do |row|
    row_string = row.join(',')
    row_with_no_newline = row_string.chomp
    title = row_string.gsub /^.+,/, ""
    
    # 
    # Preprocessing
    # 
    
    # - remove all () sections
    title.gsub! /\(.+\)/, ""
    # - remove all [] sections
    title.gsub! /\[.+\]/, ""
    # - replace accentmarks with normal letters
    title = I18n.transliterate(title)
    # - run javascript preprocessor function on the titles
        # // make lowercase
        title.downcase!
        # // replace amperstands with &
        title.gsub!(/&/, ' and ')
        # // remove non-letter-non-whitespace characters
        title_before_length = title.length
        title.gsub!(/[^\w ]+/, '')
        skip_song = (title.length + 8 < title_before_length)
        # // replace whitespace with just 1 space
        title.gsub!(/[\s\t\n\r\v]+/, ' ')
        # // remove trailing whitespace
        title.strip!
    
    # process title
    if !skip_song
        open('preprocessed_docs.csv', 'a') do |f|
            f.puts( row_with_no_newline + ',' + title )
        end
    end
end