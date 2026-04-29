import exifr from 'exifr'

self.onmessage = async (e) => {
  const { file, options } = e.data
  
  try {
    const tags = await exifr.parse(file, options)
    
    if (!tags) {
      self.postMessage({ type: 'done', data: {} })
      return
    }

    const groups: any = {}
    
    Object.entries(tags).forEach(([name, val]: [string, any]) => {
      let groupName = "Other"
      
      const lowerName = name.toLowerCase()
      if (lowerName.includes("gps")) groupName = "GPS"
      else if (['make', 'model', 'software', 'artist', 'copyright'].includes(lowerName)) groupName = "Device"
      else if (['exposuretime', 'fnumber', 'iso', 'focallength', 'lensmodel', 'datetimeoriginal'].includes(lowerName)) groupName = "EXIF"
      else if (['imagewidth', 'imageheight', 'xresolution', 'yresolution', 'orientation'].includes(lowerName)) groupName = "File"
      else if (lowerName.startsWith("xmp")) groupName = "XMP"
      else if (lowerName.startsWith("icc")) groupName = "ICC_Profile"

      if (!groups[groupName]) groups[groupName] = {}
      
      let displayVal = val
      if (val instanceof Date) {
        displayVal = val.toLocaleString()
      } else if (Array.isArray(val)) {
        displayVal = val.join(', ')
      } else if (typeof val === 'number') {
        displayVal = val.toString()
      }

      groups[groupName][name] = {
        value: val,
        description: displayVal
      }
    })

    self.postMessage({ type: 'done', data: groups })
  } catch (error: any) {
    self.postMessage({ type: 'error', error: error.message })
  }
}
