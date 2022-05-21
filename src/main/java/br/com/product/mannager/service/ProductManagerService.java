package br.com.product.mannager.service;

import br.com.product.mannager.exceptions.CrudErrorException;
import br.com.product.mannager.models.Filter;
import br.com.product.mannager.models.Product;
import br.com.product.mannager.models.Response;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProductManagerService implements CrudInterface<Product> {

    private final MongoTemplate template;

    public ProductManagerService(MongoTemplate template) {
        this.template = template;
    }

    @Override
    public Response<Product> create(Product obj) throws CrudErrorException {
        try{
            return new Response<>(
                    this.getQuantity(),
                    template.save(obj),
                    "OK"
            );
        }catch (Exception e){
            System.out.println(e.getMessage());
            throw new CrudErrorException("Erro critico na criação do objeto");
        }
    }

    @Override
    public Response<Product> update(Product obj) throws CrudErrorException {
        Response<Product> response = new Response<>();
        try{

            Query query = new Query(Criteria.where("code").is(obj.getCode()));
            Update update = new Update()
                    .set("name", obj.getName())
                    .set("url", obj.getUrl())
                    .set("brand", obj.getBrand())
                    .set("price", obj.getPrice());
            long modifications = this.template.updateFirst(query, update, Product.class).getModifiedCount();

            response.setResponse(this.template.findOne(query, Product.class));
            response.setQuantity(getQuantity());
            response.setMessage("OK: MODIFICAÇÕES - " + modifications);
            return response;

        }catch (Exception e){
            throw new CrudErrorException("Erro critico na edição do objeto");
        }
    }

    @Override
    public Response<Long> delete(String code) throws CrudErrorException{
        try{
            Query query = new Query(Criteria.where("code").is(code));
            long deleteCount = this.template.remove(query, Product.class).getDeletedCount();
            return new Response<>(
                    this.getQuantity(),
                    deleteCount,
                    "OK"
            );
        }catch (Exception e){
            throw new CrudErrorException("Erro critico na exclusão do objeto");
        }
    }

    @Override
    public Response<List<Product>> read(int skip, int limit) throws CrudErrorException {
        try{
            if(limit > 100){
                limit = 100;
            }

            Query query = new Query();
            query.with(Sort.by(Sort.Direction.DESC, "name"));
            query.skip(skip).limit(limit);
            return new Response<>(
                    this.getQuantity(),
                    this.template.find(query, Product.class),
                    "OK"
            );

        }catch (Exception e){
            System.out.println(e.getMessage());
            throw new CrudErrorException("Erro critico ao obter registros");
        }
    }

    @Override
    public Response<List<Product>> read(int skip, int limit, Filter filter, String search) throws CrudErrorException {
        try{

            if(limit > 100){
                limit = 100;
            }

            Query query = new Query(Criteria.where(filter.getFilter()).regex(search, "i"));
            query.with(Sort.by(Sort.Direction.ASC, "name"));
            query.skip(skip).limit(limit);
            return new Response<>(
                    this.getQuantity(),
                    this.template.find(query, Product.class),
                    "OK"
            );

        }catch (Exception e){
            System.out.println(e.getMessage());
            throw new CrudErrorException("Erro critico ao obter registros");
        }
    }

    private long getQuantity(){
        return this.template.count(new Query(), Product.class);
    }

}
