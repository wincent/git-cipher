# Utility code common to the the scripts in the bin/ directory.

require 'shellwords'

GPG_USER  = ENV['GPG_USER'] || 'greg@hurrell.net'
EXTENSION = 'encrypted'

def strip_heredoc(doc)
  # based on method of same name from Rails
  indent = doc.scan(/^[ \t]*(?=\S)/).map(&:size).min || 0
  doc.gsub(/^[ \t]{#{indent}}/, '')
end

def check_ignored(path)
  `git check-ignore -q #{Shellwords.escape path}`
  puts "[warning: #{path} is not ignored]" unless $?.exitstatus.zero?
end

def die(msg)
  STDERR.puts 'error:', strip_heredoc(msg)
  exit 1
end

def red(string)
  colorize(string, 31)
end

def green(string)
  colorize(string, 32)
end

def blue(string)
  colorize(string, 34)
end

def kill_line()
  # 2K deletes the line, 0G moves to column 0
  # see: http://en.wikipedia.org/wiki/ANSI_escape_code
  "\e[2K\e[0G"
end

def colorize(string, color)
  "\e[#{color}m#{string}\e[0m"
end

$force = ARGV.delete('--force') || ARGV.delete('-f')
