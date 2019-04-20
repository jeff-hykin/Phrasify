Dir.chdir __dir__ # changes directory to where this file is saved 
javascript_file        = "callback-requester.js"
output_filename        = "docs.csv"
num_tracker            = "curr_num.txt" # saves position in curr_num encase crashes it will resume where it left off
total                  = 466544         # total number   of words    inside of      words.json
chunk_size             = 100  # number of requests to make at 1 time
file_descriptor_limits = Process.getrlimit(:NOFILE)
soft_limit             = file_descriptor_limits[0]

start_time = Time.new.to_i - 1 # minus one to prevent divide by 0 
total_number_of_songs_at_start = `wc -l '#{output_filename}'`.strip.split(' ')[0].to_i
# make sure the chunk size is smaller than the file descriptor limit (otherwise the javascript will fail early)
chunk_size = chunk_size > soft_limit ? soft_limit : chunk_size 
loop do
    # 
    # get the current position
    # 
    a_file = File.open(num_tracker)
    current = a_file.read
    a_file.close
    current = current.to_i
    
    # 
    # quit if done
    # 
    if current*chunk_size > total
        break
    end
    
    # 
    # try making requests
    #
    begin
        system "node #{javascript_file} #{current*chunk_size} #{(current+1)*chunk_size}"
    rescue => exception
        puts "#{exception}".gsub /\n|^/, "\n    "
    end
    
    total_number_of_songs = `wc -l '#{output_filename}'`.strip.split(' ')[0].to_i
    puts "songs per second =  #{(total_number_of_songs - total_number_of_songs_at_start)/(Time.new.to_i - start_time)}"
    
    #
    # save new positon
    # 
    a_file = File.open(num_tracker, "w+")
    a_file.write("#{current+1}")
    a_file.close
end