# `git-cipher init`

- This is a list just because I want to prove that we can wrap a list and have it format nicely. I will eventually replace this.
- Here is a shorter list item.
- And here is a longer list item again. It is a very nice list item. Very nice. One of the best list items, probably.

To prepare a repository to use git-cipher for the first time:

```
git-cipher init
```

To prepare a local clone of a previously initialized repository:

```
git-cipher init
```

To check that an existing clone has been appropriately initialized:

```
git-cipher init
```

To keep existing secrets but change the list of recipients that have access to those secrets:

```
git-cipher unlock
git-cipher init --force --recipients <user1>,<user2>
```

(ie. the `unlock` ensures we have a local copy of the secrets, the `--force` allows us to overwrite the in-tree `.git-cipher/secrets.asc.json` file with those secrets, encrypted using the new public keys associated with `--recipients`.)

To generate new secrets (re-encrypting everything) while retaining access to existing managed files:

```
git-cipher unlock
rm .git/git-cipher/secrets.json
git-cipher init --force
```

(ie. the `--unlock` ensures we have local copies of the decrypted plaintext, the `rm` throws away the old secrets, and `--force` overwrites the in-tree `.git-cipher/secrets.asc.json` file with the new secrets.)

## Options

### `--force`

Overwrites any existing secrets at `.git-cipher/secrets.asc.json`.

### `--recipients`

Documentation here.

- This shows that I can nest lists...
- ...inside of an option. Going to make this item longer so that I can see it wrapping onto the next line also.

```
# And can do fenced code too.
```

And of course normal paragraphs.
