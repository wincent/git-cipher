# `git-cipher`
[![Gem Version](https://badge.fury.io/rb/git-cipher.svg)](http://badge.fury.io/rb/git-cipher)

`git-cipher` is a utility script for encrypting sensitive files for storage in a
public Git repo.

## Usage

```sh
git cipher encrypt [FILES...]
git cipher decrypt [FILES...]
git cipher help
```

Additionally, to avoid repeated password prompts when decrypting, `git-cipher`
provides some convenience subcommands for storing credentials in and clearing
them from a running `gpg-agent` process:

```sh
git cipher preset # stores password in running gpg-agent
git cipher forget # clears previously stored password
```

## Installation

`git-cipher` is a single Ruby script with no major dependencies beyond
[Ruby](https://www.ruby-lang.org/), [Git](http://git-scm.com/), and
[GnuPG](https://www.gnupg.org/). As such, it can be run directly from the repo:

```sh
git clone https://github.com/wincent/git-cipher.git
```

Alternatively, you can install the Gem:

```sh
gem install git-cipher
```

**Note:** If you install the `git-cipher` executable somewhere in your `$PATH`,
Git will treat it as a subcommand, which means you can invoke it as `git
cipher`. Otherwise, you will have to provide the full path to the `git-cipher`
executable.

To install the external prerequisites, use your preferred method. For example,
on OS X you might choose to use [Homebrew](http://brew.sh/):

```sh
brew install git gnupg gpg-agent
```

## Configuration

### Allowing `gpg-agent` to use preset passphrases

The use of preset passphrases allows `git-cipher` to decrypt multiple files
in multiple invocations without triggering repeated passphrase prompts. In order
to permit this, `gpg-agent` can be started as follows:

```sh
eval $(gpg-agent --daemon --allow-preset-passphrase)
```

Alternatively:

```sh
# Permanently allow use of preset passphrases with the agent:
echo allow-preset-passphrase >> ~/.gnupg/gpg-agent.conf

# Run the agent:
eval $(gpg-agent --daemon)
```

### Selecting a key for encryption and decryption

There are three ways to override the default signing key (which is
`greg@hurrell.net` and probably not useful to anybody other than me):

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

#### 3. Edit `DEFAULT_GPG_USER` in the `git-cipher` source

This last may be appropriate if you've installed by cloning the Git repo.

### Selecting a `gpg-preset-passphrase` executable

Again, there are three ways to override the default (which is
`/usr/local/opt/gpg-agent/libexec/gpg-preset-passphrase`). The exact location of
this executable will depend on the installation method you used to install
`gpg-agent`.

#### 1. Set the `GPG_PRESET_COMMAND` environment variable

```sh
GPG_PRESET_COMMAND=~/bin/gpg-preset-passphrase git cipher preset

# or alternatively:
export GPG_PRESET_COMMAND=~/bin/gpg-preset-passphrase
git cipher preset
```

#### 2. Use `git-config` to set `cipher.presetcommand`

```sh
git config cipher.presetcommand ~/bin/gpg-preset-passphrase # per-repo
git config --global cipher.presetcommand ~/bin/gpg-preset-passphrase # globally
```

#### 3. Edit `DEFAULT_GPG_PRESET_COMMAND` in the `git-cipher` source

Again, this last may be appropriate if you've installed by cloning the Git repo.

## Architecture

This section describes the background and rationale for the design of
`git-cipher`.

`git-cipher` was originally developed within the context of an
[Ansible](https://github.com/ansible/ansible/)-powered configuration repo. Some
of the files contained sensitive information so I couldn't commit them to the
repo as plaintext, but I did still want to version control them, so needed to
encrypt them prior to committing.

At the time (prior to version 1.5) Ansible didn't have the Vault feature
(equivalent to Chef's encrypted data bags), so the `git-cipher` was developed.
When the Vault feature did arrive, I decided to continue using `git-cipher`
because I liked the convenience of being able to work using my normal editor and
Ansible workflow (Vault requires you to edit files through the `ansible-vault`
command, and pass special arguments to `ansible-playbook` when running
playbooks).

`git-cipher` stores encrypted versions of sensitive files in the Git repo with
an `.encrypted` file extension. Before running Ansible commands, we decrypt the
necessary files with `git cipher decrypt`. This works well because Ansible
doesn't employ a client-server architecture like Chef or Puppet; it suffices to
have the decrypted files available on the local machine where the repo is
checked out and the commands are run.

The plain-text versions of the encrypted files should be ignored via the
gitignore mechanism (although that is only a recommendation and `git-cipher`
does nothing to enforce the policy, beyond printing a warning when it sees that
the plaintext version of an encrypted file is not being ignored).

This approach compares to using [`git
encrypt`](https://github.com/shadowhand/git-encrypt) as recommended in ["An
example of provisioning and deployment with
Ansible"](http://www.stavros.io/posts/example-provisioning-and-deployment-ansible/).
There are a couple of problems with that approach; one is that it uses
["deterministic
encryption"](http://syncom.appspot.com/papers/git_encryption.txt) in the name of
convenience, while noting that it is insecure. Additionally, [a lengthy thread
on the Git mailing
list](http://thread.gmane.org/gmane.comp.version-control.git/113124) argues that
this is an abuse of the clean/smudge filtering system.

We use semantically secure GPG encryption and make use of timestamp
comparisons to avoid unnecessary churn (in other words, we only update the
encrypted version of a file if the plain text version is newer). Note that we
effectively trust the local system's integrity, relying on filesystem
encryption, filesystem permissions, and the general security of the system to
keep the plain-text safe. Also note that, like the clean/smudge filtering, we
are effectively forgoing some of the niceties that Git offers (compression,
meaningful diffs etc) in exchange for security. (But note: you can also split
your encrypted content across smaller individual files and then pull the values
from those files into a template, preserving the ability to get meaningful diffs
of the template files themselves.)

## Tips

You may see prompts like the following, depending on the trust level of your
signing key:

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

## License

`git-cipher` is licensed under the MIT license. See the `LICENSE.txt` file in
the `git-cipher` repo for more details.
