Gem::Specification.new do |spec|
  spec.name          = 'git-cipher'
  spec.version       = '0.1'
  spec.authors       = ['Greg Hurrell']
  spec.email         = ['greg@hurrell.net']
  spec.homepage      = 'https://github.com/wincent/git-cipher'
  spec.summary       = %q{Manages encrypted content in a Git repo}
  spec.description   = %q{
    Provides a convenient workflow for working with encrypted files in a public
    Git repo. Delegates the underlying work of encryption/decryption to GnuPG.
  }
  spec.license       = 'MIT'
  spec.requirements  = %w[Git GnuPG]

  spec.files         = Dir['bin/*']
  spec.executables   = ['git-cipher']
end
