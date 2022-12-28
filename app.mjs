import express from 'express';
import hbs from'hbs';
import * as path from 'path';
// import * as favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import * as http from 'http';
import { approotdir } from './approotdir.mjs';
const __dirname = approotdir;
import {
  normalizePort, onError, onListening, handle404, basicErrorHandler
} from './appsupport.mjs';
import { router as indexRouter } from './routes/index.mjs';
import {InMemoryNotesStore} from "./models/notes-memory.mjs";
import { router as notesRouter } from './routes/notes.mjs';

export const app = express();

export const NotesStore = new InMemoryNotesStore()
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'partials'));
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Router function lists
app.use('/', indexRouter);
app.use('/notes', notesRouter);
// error handlers
// catch 404 and forward to error handler
app.use(handle404);
app.use(basicErrorHandler);
export const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

export const server = http.createServer(app);
server.listen(port);
server.on('error', (err) => onError(err, port));
server.on('listening', () => onListening(server));