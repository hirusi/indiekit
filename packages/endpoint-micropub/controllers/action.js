import httpError from 'http-errors';
import {formEncodedToMf2} from '../lib/microformats.js';
import {getAction} from '../lib/micropub.js';
import {Post} from '../lib/post.js';
import {
  createPostData,
  readPostData,
  updatePostData
} from '../lib/post/data.js';

export const actionController = publication => {
  return async (request, response, next) => {
    const action = request.query.action || request.body.action;
    const {body} = request;
    const mf2 = request.is('json') ? body : formEncodedToMf2(body);
    const operation = request.body;
    const scope = action || 'create'; // TODO: Get from IndieAuth token
    const url = request.query.url || request.body.url;

    try {
      let postData;

      // TODO: Should this follow same pattern as that for Post?
      const requestedAction = getAction(scope, action, url);
      switch (requestedAction) {
        case 'create':
          postData = createPostData(mf2, publication);
          break;
        case 'update':
          postData = await updatePostData(url, publication, operation);
          break;
        case 'delete':
        case 'undelete':
          postData = await readPostData(url, publication);
          break;
        default:
      }

      const post = new Post(publication);
      const result = await post[requestedAction](postData);
      return response.status(result.status).location(result.location).json(result);
    } catch (error) {
      return next(httpError.BadRequest(error.message)); // eslint-disable-line new-cap
    }
  };
};