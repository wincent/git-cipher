Utility script for encrypting sensitive files suitable for storage in a public
Git repo. For more details on why we need this, see bin/decrypt.

Note you need to set the key trust level on your signing key to "ultimate" to
avoid prompts like:

    It is NOT certain that the key belongs to the person named
    in the user ID.  If you *really* know what you are doing,
    you may answer the next question with yes.

You can do that with:

    gpg --edit-key greg@hurrell.net
    > trust
    > quit

decrypt -- decrypt encrypted files

Originally, Ansible didn't have the Vault feature (equivalent to Chef's
encrypted data bags), so the `decrypt` script (and its partner in crime,
`encrypt`) were developed to provide us with a workable alternative.

[Ansible 1.5 added an `ansible-vault` command that fulfils the same purpose as
these files, although arguably somewhat less conveniently (and concomittantly
more securely); for more information, see:
http://docs.ansible.com/playbooks_vault.html]

Specifically, we store encrypted versions of sensitive files in the Git repo
with an `.encrypted` file extension. Before running Ansible commands, we
decrypt the necessary files with `decrypt`. This works well because Ansible
doesn't employ a client-server architecture like Chef or Puppet; it suffices
to have the decrypted files available on the local machine where the repo is
checked out and the commands are run.

The plain-text versions of the encrypted files should be ignored via the
gitignore mechanism (although that is only a recommendation and these scripts
do nothing to enforce the policy).

This approach compares to using `git encrypt`[0] as recommended in "An example
of provisioning and deployment with Ansible"[1]. There are a couple of
problems with that approach; one is that it uses "deterministic
encryption"[2] in the name of convenience, while noting that it is insecure.
Additionally, a lengthy thread on the Git mailing list[3] argues that this is
an abuse of the clean/smudge filtering system.

We use semantically secure GPG encryption and make use of timestamp
comparisons to avoid unnecessary churn (in other words, we only update the
encrypted version of a file if the plain text version is newer). Note that we
effectively trust the local system's integrity, relying on filesystem
encryption, filesystem permissions, and the general security of the system to
keep the plain-text safe. Also note that, like the clean/smudge filtering, we
are effectively forgoing some of the niceties that Git offers (compression,
meaningful diffs etc) in exchange for security.

Finally, there is the current recommended best practice in the Ansible
community, using `vars_files`[4] and storing the sensitive information in
another repository. This might work well for small substitutions, but for
larger pieces of content like server certificates, it is more convenient to
work at the level of entire files.

Dependencies:

The use of the `--batch` and `--no-tty` switches to `gpg` requires the use of
`gpg-agent`. It can be installed with:

  brew install gpg-agent

and run with:

  eval $(gpg-agent --daemon --allow-preset-passphrase)

or:

  # with "allow-preset-passphrase" in ~/.gnupg/gpg-agent.conf
  eval $(gpg-agent --daemon)

To store the passphrase in the running `gpg-agent`:

  KEYGRIP=$(gpg --fingerprint --fingerprint greg@hurrell.net |
            grep fingerprint |
            tail -1 |
            cut -d= -f2 |
            sed -e 's/ //g')
  /usr/local/opt/gpg-agent/libexec/gpg-preset-passphrase --preset $KEYGRIP

To forget the passphrase:

  /usr/local/opt/gpg-agent/libexec/gpg-preset-passphrase --forget $KEYGRIP

As a convenience, `--preset` and `--forget` switches are provided on
`bin/decrypt` which wrap this functionality.

[0]: https://github.com/shadowhand/git-encrypt
[1]: http://www.stavros.io/posts/example-provisioning-and-deployment-ansible/
[2]: http://syncom.appspot.com/papers/git_encryption.txt
[3]: http://git.661346.n2.nabble.com/Transparently-encrypt-repository-contents-with-GPG-td2470145.html
[4]: http://www.ansibleworks.com/docs/playbooks2.html/#variable-file-separation
