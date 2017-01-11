# a-frobot

A-Frame GitHub bot.

![a-frobot](https://avatars0.githubusercontent.com/u/24716791?v=3&s=460)

Deployed on Heroku.

## Actions

- When the A-Frame code or package.json is updated, bump the A-Frame master builds.
- When the A-Frame documentation is updated, deploy the documentation on the A-Frame site.
- When the A-Frame Registry is updated, bump the A-Frame Registry builds and site.

## AWS Setup

Open inbound port 80.

```sh
sudo apt-get install git node npm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
bash && nvm install v6
git clone git@github.com:ngokevin/a-frobot && cd a-frobot && npm install
```

Have a GitHub account and get a GitHub personal access token. Put the token
in `tokens.js` as `GITHUB_TOKEN`.

Give the GitHub bot account write access to the managed repositories.

Get the AWS public URL and set up a GitHub webhook on the managed repositories
pointing to `/postreceive`. Give the webhook a secret token. Put the webhook
token in `tokens.js` as `SECRET_TOKEN`.

```sh
npm install -g forever
npm run start
forever logs 0
```

## Repository Setup

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

## Heroku Setup

> No longer being used. Heroku's 512MB memory limits are not enough.

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

### Helpful Commands

```sh
heroku logs --tail  # Real-time console logs.
heroku ps:scale web=1  # View running processes.
heroku open  # Open in browser.
heroku labs:enable log-runtime-metrics  # View resource metrics.
```

