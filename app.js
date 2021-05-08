const express = require('express');
const app = express();



const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
    if (err) throw err;
    else
        console.log(`Server listening successfully on port ${PORT}`);
})


