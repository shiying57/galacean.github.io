import { Helmet } from 'react-helmet';
import { injectIntl, useIntl } from 'react-intl';
import Footer from '../footer';
import Header from '../header';
import Advantage from './Advantage';
import Banner from './Banner';
import Cases from './Cases';
import Editor from './Editor';
import Features from './Features';
import Partners from './Partners';

function Home() {
  const intl = useIntl();
  return (
    <>
      <Header></Header>
      <Helmet>
        <title>{`Galacean - ${intl.formatMessage({
          id: 'app.home.slogan',
        })}`}</title>
        <meta
          name='Galacean'
          content={`Galacean - ${intl.formatMessage({
            id: 'app.home.slogan',
          })}`}
        />
      </Helmet>
      <Banner />
      <Advantage />
      <Editor />
      <Features />
      <Cases />
      <Partners />
      <Footer></Footer>
    </>
  );
}

export default injectIntl(Home);
