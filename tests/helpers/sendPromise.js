export default function sendPromise(method, params) {
  return new Promise(function(fulfill, reject){
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method,
      params: params || [],
      id: new Date().getTime()
    }, function(err,result) {
      if (err) {
      reject(err);
      }
      else {
      fulfill(result);
      }
    });
  });
};
