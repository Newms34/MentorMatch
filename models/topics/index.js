const mongoose = require('mongoose');
//each topic that can be taught.
const topicSchema = new mongoose.Schema({
    title: {type:String, required:true},
    desc:String,//not required, but can be helpful if this is a non-standard thing (like "making pretty websites" instead of "CSS3 Box Model")
}, { collection: 'topic' });
mongoose.model('topic', topicSchema);
