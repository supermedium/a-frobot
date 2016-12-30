# a-frobot

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
pointing to `/postreceive`. Give the webhook a secret token and also set that
as an environment variable called `SECRET_TOKEN`:

```
heroku config:set SECRET_TOKEN=def456
```

### Repository Setup

- aframevr/aframe - Webhook + Write Access
- aframevr/aframe-registry - Webhook + Write Access
- aframevr/aframe-site
- aframevr/aframevr.github.io - Write Access

## Setting up a Staging Environment

```
heroku create --remote staging
heroku config:set GITHUB_TOKEN=abc123 --remote staging
heroku config:set SECRET_TOKEN=def456 --remote staging
heroku config:set AFROBOT_ENV=staging --remote staging
git push staging master
```

## Helpful Commands

```sh
heroku logs --tail # Real-time console logs.
heroku ps:scale web=1  # View running processes.
heroku open  # Open in browser.
```
