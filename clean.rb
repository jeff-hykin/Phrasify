the_file = File.open("words.csv")
words = the_file.read.split "\n"
words.sort!
words.uniq!
new_file = File.open("unique_words.csv", "w")
new_file.write(words.join("\n"))
new_file.close