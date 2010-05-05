desc "Compile CoffeeScripts and watch for changes"
task :coffee do
  coffee = IO.popen 'coffee -wc --no-wrap src/*.coffee -o js 2>&1'
  
  while line = coffee.gets
    puts line
  end
end