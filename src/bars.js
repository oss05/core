import chart from './chart.js';
import columns from './bars/columns.js'; 
import lineAndCircles from './bars/lineAndCircles.js'; 
import quantilesAndCircles from './bars/quantilesAndCircles.js'; 
import averageLines from './bars/utils/averageLines.js'; 

function Bars(config) {
  var vm = this;
  vm._config = config; 
  vm._chart; 
  vm._scales = {}; 
  vm._axes = {};
  vm._averageLines = []; 
  vm.quantilesAndCircles = null; 
}

Bars.prototype = bars.prototype = {
	generate:function(){
		var vm = this, q, averageLines;

		vm.init();
		vm.setScales();
		vm.setAxes();

		q = vm._chart.loadData();

    q.awaitAll(function(error,data){
      if (error) {
        throw error;	 
        return false;
      } 
      vm.setData(data);
      vm.setDomains();
      vm.drawAxes();
      vm.drawData();
      vm._chart.dispatch.load(); 
    });

	},
	init : function(){
		var vm = this
		vm._chart = chart(vm._config);
    vm._chart.dispatch.on("load.chart", vm._config.events.load(vm));
	},
	setScales: function(){
		var vm = this;
    vm._scales = vm._chart.setScales();
    console.log('setScales', vm._scales)
	}, 
	setAxes : function(){
		var vm = this;

		vm._axes.x = d3.svg.axis()
		  .scale(vm._scales.x)
		  .orient("bottom");

		vm._axes.y = d3.svg.axis()
		  .scale(vm._scales.y)
		  .orient("left")


    if(vm._config.yAxis && vm._config.yAxis.ticks 
        && vm._config.yAxis.ticks.enabled === true && vm._config.yAxis.ticks.style ){

      switch(vm._config.yAxis.ticks.style){
        case 'straightLine':
          vm._axes.y
            .tickSize(-vm._chart._width,0);
        break;
      }
    }
	},
	setData:function(data){
    var vm = this;
    
    if(Array.isArray(data)){
      
      vm._data = data[0];

      if(data.length > 1){
        data.forEach(function(d,i){
          if(i>0) {
            if(vm._config.plotOptions.bars.averageLines[i-1].data.cartodb){
              vm._config.plotOptions.bars.averageLines[i-1].data.raw = d[0].avg; 
            }
          }
        });
      }
    }
  },
  setDomains:function(){
    var vm = this;
    
    var domains = vm._chart.getDomains(vm._data);

    vm._scales.x.domain(domains.x);
    vm._scales.y.domain(domains.y);

    //Quantile scale
    if(vm._scales.q){ 
      vm._scales.q.domain(domains.q);
      console.log('Domain',vm._scales.q.domain())
      console.log('Range',vm._scales.q.range())
      console.log('Treshold',vm._scales.q.quantiles());      
    }

  },
  drawAxes:function(){
    var vm = this;

     var params ={
      "config"  : vm._config, 
      "chart"   : vm._chart,
      "data"    : vm._data,
      "scales"  : vm._scales, 
    }

    var xAxis = vm._chart._svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + vm._chart._height + ")")
        .call(vm._axes.x);

    //Rotation
    xAxis.selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d) {
            return "rotate(-65)" 
            });

    if(vm._config.style){
      switch(vm._config.style){

        case 'quantilesAndCircles':
          if(vm.quantilesAndCircles === null ){
            vm.quantilesAndCircles = quantilesAndCircles(params); 
          }
          vm.quantilesAndCircles.renameAxis(xAxis);
        break
      }
    }      

    if(vm._config.xAxis && vm._config.xAxis.text){
      xAxis.append("text")
        .attr("class", "label")
        .attr("x", vm._chart._width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(vm._config.xAxis.text);
    }

    var yAxis = vm._chart._svg.append("g")
        .attr("class", "y axis")
        .call(vm._axes.y);    

    if(vm._config.yAxis && vm._config.yAxis.text){
      yAxis.append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(vm._config.yAxis.text);
    }
  },
  drawData : function(){
    var vm = this; 

    var params ={
      "config"  : vm._config, 
      "chart"   : vm._chart,
      "data"    : vm._data,
      "scales"  : vm._scales, 
    }

    if(vm._config.style){
      switch(vm._config.style){
        case 'lineAndCircles':
          vm.lineAndCircles = lineAndCircles(params); 
          vm.lineAndCircles.draw();
        break;

        case 'columns':
          vm.columns = columns(params); 
          vm.columns.draw();
        break

        case 'quantilesAndCircles':
          if(vm.quantilesAndCircles === null ){
            vm.quantilesAndCircles = quantilesAndCircles(params); 
          }
          vm.quantilesAndCircles.draw();
        break

        default:
         vm.columns(); 
        break;
      }
    }
    //Draw averageLines
    vm.averageLines = averageLines(params); 
    vm.averageLines.draw();
  },
  set: function(option,value){
    var vm = this; 
    if(option === 'config') {
      vm._config = value; 
    }else{
      vm._config[option] = value ; 
    }
    
  }, 
  redraw: function(){
    var vm = this;
    vm._chart.destroy(); 
    vm.generate();
  }
  
}


export default function bars(config) {
  return new Bars(arguments.length ? config : null);
}
