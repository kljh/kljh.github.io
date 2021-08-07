import lxml.etree as et

# Clean SVG file.
# Only attribute used is stroke color (for cutting/engraving layers)

tree = et.parse('animals.svg')
root = tree.getroot()

def cleancut(node, indent=2):
	#print(" "*indent, child.tag) # , child.attrib)
	
	for a in node.attrib:
		if a.startswith("inkscape:") or "/inkscape" in a:
			del node.attrib[a]
		if a.startswith("sodipodi:") or "/sodipodi" in a:
			del node.attrib[a]
			
	if "style" in node.attrib:
		style = node.attrib["style"]
		styles = [ kv.split(":", maxsplit=2) for kv in style.split(";") ]
		styles = [ kv for kv in styles if ( kv[0] == "stroke" and kv[1] != "#000000" ) ]
		if len(styles)==0:
			del node.attrib["style"]
		else:
			styles.append([ "stroke-width", "1px" ])
			style = ";".join([ ":".join(kv) for kv in styles ])
			node.attrib["style"] = style 

	for child in node:
		cleanink(child, indent+2)

cleancut(root)

tree.write('animals2.svg', pretty_print=True, encoding='utf-8')
print("Done.")