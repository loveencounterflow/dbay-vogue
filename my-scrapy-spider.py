import scrapy

class BlogSpider(scrapy.Spider):
  name        = 'blogspider'
  url         = 'https://www.zvg-online.net/1400/1101986118/ag_seite_001.php'
  start_urls  = [ url, ]

  def parse( self, response ):
    print( "######################### scraping #############################" )
    nr = 0
    for container in response.css('.container_vors'):
      nr += 1
      for link in response.css( 'a' ):
        yield { 'nr': nr, 'text': container.css( '::text' ).get(), }

    # for next_page in response.css('a.next'):
    #   yield response.follow(next_page, self.parse)


