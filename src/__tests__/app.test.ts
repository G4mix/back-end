import './config/setup-tests'

import './routes/docs'
import './routes/auth/signup'
import './routes/auth/signin'

import './routes/user/delete'
import './routes/user/update'

import { App } from '../config/app'

export class TestApp extends App {
    constructor() {
        super(8081)
    }
}