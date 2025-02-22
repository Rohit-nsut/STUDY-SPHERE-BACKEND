// utils.js
exports.convertSecondsToDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
  
    let duration = [];
    if (hours > 0) duration.push(`${hours}h`);
    if (minutes > 0) duration.push(`${minutes}m`);
    if (secs > 0) duration.push(`${secs}s`);
  
    return duration.length > 0 ? duration.join(" ") : "0s";
  }
  