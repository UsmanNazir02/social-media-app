const { Router } = require('express');
const AuthAPI = require('./authApi');
const PostAPI = require('./postApi');
const UserAPI = require('./userApi');

class API {
    constructor(app) {
        this.app = app;
        this.router = Router();
        this.routeGroups = [];
    }

    loadRouteGroups() {
        this.routeGroups.push(new AuthAPI());
        this.routeGroups.push(new PostAPI());
        this.routeGroups.push(new UserAPI());
    }

    setContentType(req, res, next) {
        if (!req.is('multipart/form-data')) {
            res.set('Content-Type', 'application/json');
        }
        next();
    }

    registerGroups() {
        this.loadRouteGroups();
        this.routeGroups.forEach((rg) => {
            console.log('Route group: ' + rg.getRouterGroup());
            this.app.use('/api' + rg.getRouterGroup(), this.setContentType, rg.getRouter());
        });
    }
}

module.exports = API;