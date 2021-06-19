// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'z8usnty244'
export const apiEndpoint = `https://${apiId}.execute-api.us-west-2.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'rownet.auth0.com',            // Auth0 domain
  clientId: '1MxNWC6vwgXtFhz6qFeGPK2Xv81CbasZ',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
