from PIL import Image

def encode(img_path, msg, output):
    img = Image.open(img_path)
    encoded = img.copy()
    width, height = img.size
    pixels = encoded.load()

    msg += chr(0)  # delimiter to mark end of message
    
    binary = ''.join([format(ord(i), '08b') for i in msg])
    idx = 0

    for y in range(height):


        for x in range(width):
            if idx < len(binary):
                r, g, b = pixels[x, y]
                
                r = (r & ~1) | int(binary[idx])
                idx += 1
                pixels[x, y] = (r, g, b)
            else:


                encoded.save(output)
                return


def decode(img_path):
    img = Image.open(img_path)
    binary = ''

    width, height = img.size
    pixels = img.load()
    

    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            
            binary += str(r & 1)
    chars = [binary[i:i+8] for i in range(0, len(binary), 8)]
    
    msg = ''.join(chr(int(c, 2)) for c in chars)
    return msg.split(chr(0))[0]
