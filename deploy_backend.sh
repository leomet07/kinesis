# git subtree push --prefix server/ heroku master
git push heroku `git subtree split --prefix server/`:master --force