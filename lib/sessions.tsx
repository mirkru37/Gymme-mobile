import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const Sessions = {
  refresh: async () => {
    const response = await axios.post('https://mighty-scrubland-18407-d62215933318.herokuapp.com/api/v1/sessions/refresh', {
      refresh_token: await AsyncStorage.getItem('refresh_token'),
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Api-Key': 'yEFwep07HplW4PtBy7STdOS0l+1vExA+8TK08aoSyeg=',
        'Accept': '*/*',
      }
    });

    console.log(response.data);

    const { access_token, refresh_token } = response.data;

    await AsyncStorage.setItem('access_token', access_token);
    await AsyncStorage.setItem('refresh_token', refresh_token);
  }
}

export default Sessions;