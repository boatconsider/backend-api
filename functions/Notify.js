const axios = require('axios');

exports.notifyLine = async (token, message) => {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://notify-api.line.me/api/notify',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer ' + token
      },
      data: 'message=' + message, // แก้เป็น 'message=' + message
    });

    console.log("notify", response.data); // แก้เป็น response.data
  } catch (err) {
    console.error(err);
  }
};
