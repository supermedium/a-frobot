# afro

A-Frame GitHub bot.

![a-frobot](https://avatars0.githubusercontent.com/u/24716791?v=3&s=460)

Deployed on Heroku.

## Setup

Install Heroku.

Have a GitHub account and get a GitHub personal access token.

```sh
npm install
heroku login
heroku create
git push origin master
git push heroku master
heroku config:set GITHUB_TOKEN=abc123
```

Give the GitHub bot account write access to the managed repositories.

Get the Heroku URL and set up a GitHub webhook on the managed repositories
pointing to `/postreceive`.

### Helpful Commands

```sh
heroku ps:scale web=1  # View running processes.
heroku open  # Open in browser.
heroic keys:add  # Add SSH key.
heroic run bash  # SSH.
```
