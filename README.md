![git-cipher](https://raw.github.com/wincent/git-cipher/media/git-cipher.png)

# Introduction

[![Gem Version](https://badge.fury.io/rb/git-cipher.svg)](http://badge.fury.io/rb/git-cipher)

`git-cipher` is a utility script for encrypting sensitive files for storage in a public Git repo.

## Usage

```sh
git cipher decrypt [FILES...] # decrypts files
git cipher encrypt [FILES...] # encrypts files
git cipher log [FILES...]     # shows log with (plaintext) diffs
git cipher ls                 # lists encrypted files
git cipher status             # shows decrypted/modified/missing status
git cipher help
```

## Installation

`git-cipher` is a single Ruby script with no major dependencies beyond [Ruby](https://www.ruby-lang.org/), [Git](http://git-scm.com/), and [GnuPG](https://www.gnupg.org/). As such, it can be run directly from the repo:

```sh
git clone https://github.com/wincent/git-cipher.git
```

Alternatively, you can install the Gem:

```sh
gem install git-cipher
```

**Note:** If you install the `git-cipher` executable somewhere in your `$PATH`, Git will treat it as a subcommand, which means you can invoke it as `git cipher`. Otherwise, you will have to provide the full path to the `git-cipher` executable.

To install the external prerequisites, use your preferred method. For example, on macOS you might choose to use [Homebrew](http://brew.sh/):

```sh
brew install git gnupg gpg-agent
```

## Configuration

### Selecting a key for encryption and decryption

`git-cipher` will encrypt files using a recipient key (public). Only the recipient can decrypt the files (using their private key). It is possible to select multiple, comma-separated recipients such that any one of them can decrypt the files, using their own key.

There are three ways to override the default recipient key (which is `greg@hurrell.net,wincent@github.com` and therefore probably not useful to anybody other than me):

#### 1. Set the `GPG_USER` environment variable

```sh
GPG_USER=jane@example.com git cipher decrypt

# or alternatively:
export GPG_USER=jane@example.com
git cipher decrypt
```

#### 2. Use `git-config` to set `cipher.gpguser`

```sh
git config cipher.gpguser jane@example.com # per-repo
git config --global cipher.gpguser jane@example.com # globally
```

#### 3. Edit `DEFAULT_GPG_USERS` in the `git-cipher` source

This last may be appropriate if you've installed by cloning the Git repo.

## Usage on Arch Linux

For most of the lifetime of `git-cipher`, I've been using it on macOS, where everything works pretty much seamlessly out of the box, especially since moving to GnuPG v2 (see [commit fd4c78aeb9d11](https://github.com/wincent/git-cipher/commit/fd4c78aeb9d11d44c7107e6a2857f0c41e0b3887) for more details of how things were streamlined by v2). On Arch Linux, I have found that I needed to do a bit of additional manual set-up.

The goal is to cache the secret key in the GPG agent so that you don't have to re-enter the password for every file.

First of all, to find out the "keygrip" of the secret key:

- `gpg --with-keygrip -K` (lists all secret keys)
- `gpg --fingerprint --with-keygrip greg@hurrell.net` (lists a specific key; [source](https://unix.stackexchange.com/a/342461/140622))

Once you have the keygrip (eg. a string like `0551973D09...`), you can allow it to be added as a "preset" passphrase (ie. cache it in the agent for the duration of the session). To achieve this, the following line:

```
allow-preset-passphrase
```

must be present in the `~/.gnupg/gpg-agent.conf` file.

You then need to tell GnuPG how to prompt for a password using a "pin helper". You can see which helpers are available with:

```sh
pacman -Ql pinentry | grep /usr/bin/
```

That will produce a list similar to:

```
pinentry /usr/bin/
pinentry /usr/bin/pinentry
pinentry /usr/bin/pinentry-curses
pinentry /usr/bin/pinentry-emacs
pinentry /usr/bin/pinentry-gnome3
pinentry /usr/bin/pinentry-gtk-2
pinentry /usr/bin/pinentry-qt
pinentry /usr/bin/pinentry-tty
```

Configure one to be used by adding to `~/.gnupg/gpg-agent.conf`:

```
pinentry-program /usr/bin/pinentry-curses
```

After making any changes, [reload the agent](https://wiki.archlinux.org/title/GnuPG#gpg-agent):

```sh
gpg-connect-agent reloadagent /bye
```

You can confirm which keys are known to the agent like so:

```sh
gpg-connect-agent 'keyinfo --list' /bye
```

Which will show a list like:

```
S KEYINFO 9BB6077848... D - - - P - - -
S KEYINFO A05D018ED6... D - - - P - - -
S KEYINFO 26CA5BE9E3... D - - - P - - -
S KEYINFO 4435E5FDCC... D - - - P - - -
S KEYINFO 0551973D09... D - - - P - - -
S KEYINFO 2529B67D84... D - - - P - - -
```

A `1` before the `P` shows that the key is [cached in the agent](https://unix.stackexchange.com/a/467062/140622), which means that none of the keys in the example list above are actually cached.

To actually cache the key, you can run:

```sh
/usr/lib/gnupg/gpg-preset-passphrase --preset 0551973D09...
```

If you redo the `keyinfo --list` operation, you should now see the expected `1`:

```
S KEYINFO 9BB6077848... D - - - P - - -
S KEYINFO A05D018ED6... D - - - P - - -
S KEYINFO 26CA5BE9E3... D - - - P - - -
S KEYINFO 4435E5FDCC... D - - - P - - -
S KEYINFO 0551973D09... D - - 1 P - - -
S KEYINFO 2529B67D84... D - - - P - - -
```

## Architecture

This section describes the background and rationale for the design of `git-cipher`.

`git-cipher` was originally developed within the context of an [Ansible](https://github.com/ansible/ansible/)-powered configuration repo. Some of the files contained sensitive information so I couldn't commit them to the repo as plaintext, but I did still want to version control them, so needed to encrypt them prior to committing.

At the time (prior to version 1.5) Ansible didn't have the Vault feature (equivalent to Chef's encrypted data bags), so the `git-cipher` was developed. When the Vault feature did arrive, I decided to continue using `git-cipher` because I liked the convenience of being able to work using my normal editor and Ansible workflow (Vault requires you to edit files through the `ansible-vault` command, and pass special arguments to `ansible-playbook` when running playbooks).

`git-cipher` stores encrypted versions of sensitive files in the Git repo with an `.encrypted` file extension. Before running Ansible commands, we decrypt the necessary files with `git cipher decrypt`. This works well because Ansible doesn't employ a client-server architecture like Chef or Puppet; it suffices to have the decrypted files available on the local machine where the repo is checked out and the commands are run.

The plain-text versions of the encrypted files should be ignored via the gitignore mechanism (although that is only a recommendation and `git-cipher` does nothing to enforce the policy, beyond printing a warning when it sees that the plaintext version of an encrypted file is not being ignored).

This approach compares to using [`git encrypt`](https://github.com/shadowhand/git-encrypt) as recommended in ["An example of provisioning and deployment with Ansible"](http://www.stavros.io/posts/example-provisioning-and-deployment-ansible/). There are a couple of problems with that approach; one is that it uses ["deterministic encryption"](http://syncom.appspot.com/papers/git_encryption.txt) in the name of convenience, while noting that it is insecure. Additionally, [a lengthy thread on the Git mailing list](http://thread.gmane.org/gmane.comp.version-control.git/113124) argues that this is an abuse of the clean/smudge filtering system.

We use semantically secure GPG encryption and make use of timestamp comparisons to avoid unnecessary churn (in other words, we only update the encrypted version of a file if the plain text version is newer). Note that we effectively trust the local system's integrity, relying on filesystem encryption, filesystem permissions, and the general security of the system to keep the plain-text safe. Also note that, like the clean/smudge filtering, we are effectively forgoing some of the niceties that Git offers (compression, meaningful diffs etc) in exchange for security. (But note: you can also split your encrypted content across smaller individual files and then pull the values from those files into a template, preserving the ability to get meaningful diffs of the template files themselves. The `log` subcommand also goes some way towards providing visualization of change over time in encrypted files.)

For an example of `git-cipher` usage in the wild, see files like [this one](https://github.com/wincent/wincent/blob/098b487c495ffa22135df7f4b28ad5006d1965b2/roles/ssh/files/.ssh_config.encrypted) in [my dotfiles repo](https://github.com/wincent/wincent). Others in that repo can be found by searching for files with the `.encrypted` suffix.

Although `git-cipher` can be obtained as a RubyGem, the executable itself is, by-design, a single file. This is to reduce the dependency footprint, making it more suitable for use in boot-strapped environments (which might not have RubyGems installed yet).

## Tips

You may see prompts like the following, depending on the trust level of your signing key:

```Text
It is NOT certain that the key belongs to the person named
in the user ID.  If you *really* know what you are doing,
you may answer the next question with yes.
```

You can avoid these prompts by setting the trust level to "ultimate" like this:

```sh
gpg --edit-key greg@hurrell.net # or $GPG_USER
> trust
> quit
```

## Author

`git-cipher` was hacked together by Greg Hurrell (<greg@hurrell.net>).

## Development

This is minimal, currently with no tests, no Bundler, no Rakefile. To cut a new release, update the version number in the gemspec and:

```sh
git tag -s 0.2 -m "0.2 release"
git push --follow-tags origin main
gem build git-cipher.gemspec
gem push git-cipher-0.2.gem
```

## License

`git-cipher` is licensed under the MIT license. See the `LICENSE.txt` file in the `git-cipher` repo for more details.
