![git-cipher](https://raw.github.com/wincent/git-cipher/media/git-cipher.png)

# Introduction

git-cipher is a tool for encrypting sensitive files for storage in a public Git repo.

> :warning: This documentation refers to version 2.0 of git-cipher, which is a NodeJS package and a complete rewrite from version 1.0, which was a Ruby script and used a different encryption protocol.
>
> For differences between version 1.0 and 2.0, please see [UPGRADING](UPGRADING.md). For more on version 1.0, please see [the `1-x-release` branch](https://github.com/wincent/git-cipher/tree/1-x-release).

## Usage

```sh
git cipher init
git cipher unlock
git cipher add
git cipher ls
git cipher lock
git cipher help
```

## Commands

TODO: instead of documenting this exhaustively here, do it in the build-in help for each command; we can link to it from here.

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
