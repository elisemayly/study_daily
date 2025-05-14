const axios = require("axios");

axios.post("http://localhost:8080/auditManagement/addUser", {
    username: "admi1",
    password: "123456",
    role: "superAdmin"
}).then(res => {
    console.log(res.data.message);
}).catch(err => {
    console.log(err?.response?.data?.message || "添加失败");
});