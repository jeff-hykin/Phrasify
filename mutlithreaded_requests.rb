Dir.chdir __dir__ # changes directory to where this file is saved 
javascript_file        = "callback-requester.js"
num_tracker            = "curr_num.txt" # saves position in curr_num encase crashes it will resume where it left off
total                  = 227633         # total number   of words    inside of      words.json
chunk_size             = 100  # number of requests to make at 1 time
file_descriptor_limits = Process.getrlimit(:NOFILE)
soft_limit             = file_descriptor_limits[0]
# make sure the chunk size is smaller than the file descriptor limit (otherwise the javascript will fail early)
chunk_size = chunk_size > soft_limit ? soft_limit : chunk_size 
for current in 1...(total/chunk_size) do
    # 
    # quit if done
    # 
    if current*chunk_size > total
        break
    end
    
    # start up a thread for each of the chunks
    eval <<-HEREDOC
        Thread.new {
            begin
                system "node #{javascript_file} #{current*chunk_size} #{(current-1)*chunk_size}"
            rescue => exception
                puts "Error with #{current} chunk"
            end
            puts "done with #{current} chunk"
        }
    HEREDOC
end