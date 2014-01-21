import urllib2, csv
from bs4 import BeautifulSoup

urlize = lambda bit: "http://www.pro-football-reference.com/years/"+str(bit)+"/games.htm"

with open("nfl_scores.csv", "w") as csv_file:
	writer = csv.writer(csv_file)
	writer.writerow(['week','day','date','year','league','link','winner','at','loser','pts_w','pts_l','yds_w','to_w','yds_l','to_l'])
	nfls = map(lambda year: ('nfl', year, urlize(year)), range(1940,2014))
	afls = map(lambda year: ('afl', year, urlize(str(year)+"_AFL")), range(1960,1970))	
	aafcs =  map(lambda year: ('aafc', year, urlize(str(year)+"_AAFC")), range(1946,1950))
	for item in (nfls+afls+aafcs):
		league = item[0]
		year = item[1]
		url = item[2]
		print url
		soup = BeautifulSoup(urllib2.urlopen(url).read())
		for row in soup('table', {'id': 'games'})[0].tbody('tr'):
			if 'thead' in row.attrs['class'] or 'csk' not in row('td')[2].attrs:
				continue
			cols = row('td')
			week = cols[0].text
			day = cols[1].text
			date = cols[2].attrs['csk']
			if date.startswith('zz'):
				date = cols[2].text
			link = row('td')[3]('a')[0].attrs['href']
			winner = cols[4].text
			at = cols[5].text
			loser = cols[6].text
			pts_w = int(cols[7].text)
			pts_l = int(cols[8].text)
			yds_w = int(cols[9].text)
			to_w = int(cols[10].text)
			yds_l = int(cols[11].text)
			to_l = int(cols[12].text)
			writer.writerow([week,day,date,year,league,link,winner,at,loser,pts_w,pts_l,yds_w,to_w,yds_l,to_l])
